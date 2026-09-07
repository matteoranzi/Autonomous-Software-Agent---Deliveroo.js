// Monte Carlo Tree Search (MCTS)

import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {desireIdentity} from "@/agents/BDI_Agent/intentions/utils";
import {IDesire, DesireCategory} from "@/agents/BDI_Agent/desires/IDesire";

type SimulationState = {
    belief: Belief; // read-only reference to the live belief this search started from - never mutated
    position: Position;
    carriedCount: number;
    visited: Set<string> // desireIdentity() of every desire already taken this rollout
    accumulatedReward: number;
}

// Dynamic transition function: the tree is built incrementally node by node as MCTS explores.
function availableActions(state: SimulationState, allDesires: IDesire[]): IDesire[] {
    const capacity = state.belief.gameConfig.agent.capacity;

    return allDesires.filter((desire: IDesire) => {
        if (state.visited.has(desireIdentity(desire))) {
            return false;
        }
        if (desire.category === DesireCategory.DELIVER) {
            return state.carriedCount > 0;
        }
        if (desire.category === DesireCategory.PICKUP) {
            return state.carriedCount < capacity;
        }
        return true; // Explore can always happen
    });
}

export {SimulationState, availableActions};