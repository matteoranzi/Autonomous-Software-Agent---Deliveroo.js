# Deliveroo Autonomous Agent

## Authors

- Matteo Ranzi
- Luca Hardonk

## Project Overview

This project is part of the master course "Autonomous Software Agents" @ UniTN 2025-26. The goal
is to build an autonomous agent, using the Belief-Desire-Intention (BDI) architecture, that plays
Deliveroo.js: moving around a grid map, picking up parcels and delivering them for reward before
they decay.

The agent's intention selection is the core of the project: a Monte Carlo Tree Search (MCTS)
strategy searches over sequences of desires (pickup/deliver/explore), using A*/PDDL pathfinding
costs as edge weights and a Mamdani-style fuzzy inference system as the reward signal, as an
alternative to a simpler greedy strategy.

## Repository Structure

```plaintext
Deliveroo-autonomous-agent/
├── src/
│   ├── agents/
│   │   ├── BDI_Agent/
│   │   │   ├── beliefs/                     # Belief base: map, parcels, agents, crates + change-detection strategies
│   │   │   ├── desires/                     # Pickup/Deliver/Explore desires and their utility evaluation
│   │   │   ├── intentions/
│   │   │   │   ├── selection_strategies/    # GreedyIntentionStrategy, MCTSIntentionStrategy (+ mcts/ internals)
│   │   │   │   ├── reconsideration_policies/# Single-minded / open-minded commitment strategies
│   │   │   │   └── fuzzy_logic/             # FuzzyDesirabilityScorer (Mamdani inference, used as MCTS's reward)
│   │   │   ├── planning/
│   │   │   │   ├── pathfinding/             # A* and PDDL-based pathfinders (crate-pushing support)
│   │   │   │   └── recover_plans_strategies/# Retry/replan/recycle strategies for failed plans
│   │   │   └── BDI_Agent.ts                 # Wires belief/desire/intention/planning into the deliberation loop
│   │   └── LLM_Agent/                       # Secondary, LLM-driven exploratory agent
│   ├── io/adapters/                         # Server payload -> internal Belief type adapters
│   ├── config.ts                            # Reads/validates environment configuration
│   └── main.ts                              # Entry point
├── documentation/                           # Design notes, calibration reports, architecture docs
├── .env.example                             # Environment variable template
└── package.json
```

## Getting Started

### Install

```sh
git clone https://github.com/matteoranzi/Autonomous-Software-Agent---Deliveroo.js.git
cd Deliveroo-autonomous-agent
npm install
cp .env.example .env
```

### Services

Each agent depends on one or more external services, configured entirely through `.env`:

- **Deliveroo.js game server** - `HOST`/`TOKEN` for the BDI Agent; per-agent `host`/`token` in
  `src/agents/LLM_Agent/config.json` for the LLM Agent.
- **PAAS (Planning as a Service)** - `PAAS_HOST`/`PAAS_PATH`, required by the BDI Agent's
  PDDL pathfinder (crate-pushing plans). Set up a local instance via the
  [Planutils Server Environment](https://github.com/AI-Planning/planutils/tree/main/environments/server),
  or point at a hosted one.
- **LiteLLM** - `LLM_TARGET` (`local`/`remote`) plus the matching `LOCAL_*`/`REMOTE_*` triplet
  (base URL, API key, model), required by the LLM Agent.

### BDI Agent

Requires: Deliveroo.js server, PAAS.

1. Set `HOST`/`TOKEN` and `PAAS_HOST`/`PAAS_PATH` in `.env`.
2. `npm run main` (or `npm run build && npm run run_compiled` for a compiled run).

### LLM Agent (experimental)

Requires: Deliveroo.js server, LiteLLM. A separate, plain-JS agent (`src/agents/LLM_Agent/`) that
drives Deliveroo via an LLM through a LiteLLM proxy, with a live dashboard.

1. Set `LLM_TARGET` + the matching `LOCAL_*`/`REMOTE_*` triplet in `.env`.
2. Add game-server agent name/type/token entries to `src/agents/LLM_Agent/config.json`.
3. `npm run llm_agent_dashboard` - dashboard at http://localhost:3001
4. `npm run llm_agent` - spawns the agents listed in `config.json`

## Key Components

### Belief

`Belief` holds everything the agent knows: the map, parcels, other agents, crates. A pluggable set
of change-detection strategies (`beliefs/changes_detection_strategies/`) diffs incoming sensing
events against current belief and reports what actually changed (parcel appeared/vanished, rival
picked up/dropped, self entered/exited a tile, ...), which is what triggers re-deliberation.

### Desires

Each `IDesire` (pickup a parcel, deliver at a tile, explore an unobserved spawner tile) evaluates
itself into a utility, an estimated cost, an expected reward, urgency and risk. `DesiresGenerator`
builds the current desire set from belief on every deliberation cycle.

### Intentions

`Intention` commits to a single desire at a time, chosen via a pluggable `IIntentionStrategy`:

- **GreedyIntentionStrategy** - picks the best desire per capacity/priority bucket, no lookahead.
- **MCTSIntentionStrategy** - runs Selection/Expansion/Simulation/Backpropagation over simulated
  sequences of desires, scoring each step with `FuzzyDesirabilityScorer` (cost/reward/urgency/risk
  fuzzified and combined via Mamdani inference, breakpoints derived from the live map/game config)
  and returning the most-visited root action.

A separate `IReconsiderationStrategy` decides whether to keep or drop the current commitment as
belief updates mid-plan.

### Planning

`Planner` tries multiple `IPathFinder`s in order: `AStarPathFinder` for direct movement, and
`PDDL_PathFinder` (via an external PDDL solver) when a path needs to push crates out of the way.
`PlanExecutor` runs the resulting action plan and recovers from failures using pluggable
retry/replan/recycle strategies.
