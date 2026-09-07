# Fuzzy scorer / MCTS calibration

Calibration pass for `FuzzyDesirabilityScorer` (cost/reward breakpoints, rule base) and
`MCTSIntentionStrategy` (exploration constant), done by instrumenting the live agent and reading
real per-match data instead of guessing constants.

## Instrumentation added

1. **One-time `gameConfig`/map-size dump** (`BDI_Agent.ts`, right after the initial `Belief` is
   built) - `reward_average`, `reward_variance`, agent `capacity`, map `width`/`height`, all only
   known once connected to the server.
2. **`[FUZZY-CALIBRATE]`** (`FuzzyDesirabilityScorer.ts`, every 200 scored evaluations) - observed
   min/max `estimatedCost`, `expectedReward`, and resulting score, per desire category, logged
   alongside the `FuzzyScale` they were judged against.
3. **`[MCTS-CALIBRATE]`** (`MCTSIntentionStrategy.ts`, once per `select()` call) - root children
   count, total visits across them (sanity check: always equals `iterations`), and the top-3
   most-visited children with their average reward.

## Findings and fixes

### Fuzzy scale must come from `gameConfig`/`map`, not fixed constants

Map size and parcel reward distribution are per-match, server-provided values - they can differ
every game. Fixed breakpoints (`COST_LOW_MAX = 5`, etc.) would need re-tuning by hand every time
the map/config changes. `FuzzyDesirabilityScorer` is now a class constructed once per search
(mirrors `CostEstimator`'s one-instance-per-search lifetime) whose `computeScale(belief)` derives
breakpoints from the live `Belief`:

- **Cost breakpoints were based on the map's Euclidean diagonal** (`sqrt(w²+h²)`, ≈42 on a 30×30
  map) but real A* cost regularly hit 55-58 in practice - obstacles and detours push grid-based
  traversal cost well past straight-line distance. Fixed: now derived from `width + height`
  (Manhattan-ish upper bound, ≈60 here), which matched the observed max almost exactly.
- **Reward breakpoints were `reward_average ± sqrt(reward_variance)`**, which degenerates when
  `reward_variance = 0` (every parcel spawns at the same fixed reward, only decay lowers it) -
  all three breakpoints collapsed onto the same value, making `rewardLow` and `rewardHigh` fire
  at full strength simultaneously on every single pickup evaluation. Fixed: breakpoints are now
  fixed fractions/multiples of `reward_average` alone (0.3× / 1× / 1.75×), which stays meaningful
  at zero variance and still lets a multi-parcel delivery (summed reward) read as HIGH.

### Two desires never populated a real reward signal

- `DeliverParcelDesire.evaluate()` hardcoded `expectedReward: 0` - delivering had no reward signal
  reaching the fuzzy scorer at all, relying entirely on `urgency === HIGH`. Fixed: sums the reward
  of every parcel currently carried by the agent.
- `ObserveParcelSpawningTileDesire.evaluate()` also hardcoded `expectedReward: 0`; its real signal
  (tile staleness) was only written to `utility`, a field the fuzzy scorer never reads (MCTS
  discards `.utility` entirely). Every explore desire was fuzzy-indistinguishable regardless of how
  stale the tile was. Also, the staleness formula itself (`2^(age/900)`) blew up to astronomic
  values within seconds. Fixed: replaced with a linear, capped value (`min(age/1000, 30)`) fed into
  both `utility` and `expectedReward`.

### Risk rules were dead weight

`risk` is hardcoded to `0` in every desire (`IDesire.ts` / all concrete desires), so `riskLow` was
`1` on literally every evaluation - the two risk-based rules fired identically every time,
uniformly dragging every score toward LOW regardless of cost/reward. Removed both rules until
something actually populates a non-zero risk.

### MCTS exploration constant: branching factor was the real bottleneck, not the UCB1 constant

`[MCTS-CALIBRATE]` showed root branching factor of **57-95 children** per `select()` call, mostly
from `ObserveParcelSpawningTileDesire` - one per spawner tile (the file's own header comment
already flags this as "DUMB EXPLORATION LOGIC FOR NOW"). With only 100 iterations, UCB1 forces one
visit to every unvisited child before it can exploit at all, so 60-95 of the 100-iteration budget
is consumed by that single forced pass, leaving little room for real refinement.

Confirmed two ways:
- `totalVisits` always equals `iterations` exactly (backpropagation accounting is correct).
- Visit concentration improved sharply whenever branching happened to be lower - e.g. 37 visits on
  the top child at 58 root children, vs. 2-3 visits spread thin at 90+ children.

**Recommendation:** raising `explorationConstant` or `iterations` alone doesn't address the root
cause - the fix is capping/sampling explore desires generated per cycle (or shipping the
already-stubbed `MaximumCoverageExploreParcelSpawningTileDesire`), since that's what inflates
branching. Raising `iterations` (e.g. 100 → 400-500) is a reasonable short-term mitigation in the
meantime.

## Current scale (this match: 30×30 map, `reward_average = 30`, `reward_variance = 0`)

```json
{"costLowMax": 9, "costMidPeak": 18, "costHighMin": 30, "rewardLowMax": 9, "rewardMidPeak": 30, "rewardHighMin": 52.5}
```

The 0.15 / 0.30 / 0.50 (cost) and 0.3× / 1× / 1.75× (reward) multipliers in `computeScale` are
still first-pass estimates - now grounded in real observed data instead of arbitrary numbers, but
worth revisiting once the branching-factor fix is in and scores stop being iteration-budget-starved.

## Verification

`npx tsc --noEmit` clean throughout. Three live ~20s runs (`/opt/homebrew/bin/npm run main`)
confirmed no runtime errors and produced the data above.

## Future work: warm-up with `GreedyIntentionStrategy`, then hot-swap to MCTS

Idea for a future development phase: start each match on `GreedyIntentionStrategy` (cheap, no MCTS
overhead, doesn't care about branching factor) for a warm-up period, collecting real map
statistics, then hot-swap to `MCTSIntentionStrategy` once enough data is available - effectively
automating the manual run-log-tune loop described above.

**Design sketch:** a `WarmupThenMCTSIntentionStrategy` wrapper implementing `IIntentionStrategy`,
holding both a `GreedyIntentionStrategy` and an `MCTSIntentionStrategy` internally and delegating
`select()` to one or the other depending on warm-up state. This keeps `Intention.ts` untouched -
the swap happens inside the wrapper, not by replacing what `Intention` holds.

**What "collect statistics" should mean concretely:** formalize the `_calibrationStats` collector
already living (as private module state, for logging only) inside `FuzzyDesirabilityScorer.ts`
into a proper queryable object - real observed min/max cost and reward per category, fed into
`computeScale()` instead of (or alongside) today's `gameConfig`/map-size heuristic. Real observed
ranges reflect this map's actual obstacle layout, not just its bounding box.

**Open questions to settle when this is actually built:**
- **Swap trigger** - fixed wall-clock warm-up, a minimum number of desire evaluations observed, or
  a hybrid ("whichever comes first, capped")? A pure timer risks swapping before any parcel has
  spawned; a pure evaluation-count trigger risks never firing if desires stay sparse.
- **One-directional vs. reversible** - does it ever swap back to Greedy (e.g. if collected stats
  look degenerate, or belief resets), or is warm-up strictly once-per-run?
- **Non-stationarity** - statistics gathered in an early window may not represent later map
  conditions (e.g. parcels clustering elsewhere later). This is an approximation the design should
  be honest about, not something the swap-trigger choice alone fixes.

**Relationship to the branching-factor finding above:** this would make cost/reward calibration
map-accurate automatically, removing the need for a human to run-log-tune by hand. It does **not**
by itself fix root branching factor from `ObserveParcelSpawningTileDesire` - that's orthogonal and
still needs the explore-desire capping/sampling fix, independent of which strategy is active during
warm-up.

Not implemented yet - captured here as a design direction for a later phase.