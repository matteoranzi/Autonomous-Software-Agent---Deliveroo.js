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

### Installation

1. **Clone the repository and install dependencies:**
   ```sh
   git clone https://github.com/matteoranzi/Autonomous-Software-Agent---Deliveroo.js.git
   cd Deliveroo-autonomous-agent
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your Deliveroo.js server host/token:
   ```sh
   cp .env.example .env
   ```
   A PAAS (Planning as a Service) is also required for the PDDL pathfinder.

   **Set up a Docker environment** following the instructions in the [Planutils Server Environment](https://github.com/AI-Planning/planutils/tree/main/environments/server) to set up the Docker environment required for the PDDL planners.

3. **Run the agent:**
   ```sh
   npm run main
   ```
   For a compiled build: `npm run build && npm run run_compiled`.

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
