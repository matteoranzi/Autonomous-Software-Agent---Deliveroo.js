import {
    availableActions,
    SimulationState
} from "@/agents/BDI_Agent/intentions/selection_strategies/mcts/SimulationState";
import {DesireCategory, IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {CostEstimator} from "@/agents/BDI_Agent/planning/CostEstimator";
import {scoreDesirability} from "@/agents/BDI_Agent/intentions/fuzzy_logic/FuzzyDesirabilityScorer";
import {desireIdentity} from "@/agents/BDI_Agent/intentions/utils";

class MCTSNode {
    readonly state: SimulationState;
    readonly desireTaken: IDesire | null; // The action that le here from the parent. null for the root node.
    readonly parent: MCTSNode | null;
    readonly children: MCTSNode[] = [];
    readonly untriedActions: IDesire[];

    visits = 0;
    totalReward = 0;

    constructor(state: SimulationState, desireTaken: IDesire | null, parent: MCTSNode | null, allDesires: IDesire[]) {
        this.state = state;
        this.desireTaken = desireTaken;
        this.parent = parent;
        this.untriedActions = availableActions(state, allDesires);
    }

    get isFullyExpanded(): boolean {
        return this.untriedActions.length === 0;
    }

    get averageReward(): number {
        return this.visits === 0 ? 0 : this.totalReward / this.visits;
    }
}

// Builds the child Simulation reached by taking `desire` from `parentState`.
// Desire's evaluation cost field is recomputed with a simulation-aware evaluation.
async function applyAction(parentState: SimulationState, desire: IDesire, costEstimator: CostEstimator): Promise<SimulationState> {
    if (!desire.goal.valid) {
        throw new Error("applyAction: desire.goal in invalid - availableActions should neve surface an invalid desire");
    }

    const estimatedCost = await costEstimator.estimateCost(parentState.position, desire.goal.position);
    const evaluation = await desire.evaluate(); // Fixme: here DesireEvaluation is needed, but internally recomputes the cost from agent position (recomputing unnecessarily the cost that was already estimated by the costEstimator)
    const stepReward = scoreDesirability({...evaluation, estimatedCost});

    let carriedCount = parentState.carriedCount;
    if (desire.category === DesireCategory.PICKUP) {
        carriedCount = Math.min(carriedCount + 1, parentState.belief.gameConfig.agent.capacity);
    } else if (desire.category === DesireCategory.DELIVER) {
        carriedCount = 0;
    }

    return {
        belief: parentState.belief,
        position: desire.goal.position,
        carriedCount,
        visited: new Set([...parentState.visited, desireIdentity(desire)]),
        accumulatedReward: parentState.accumulatedReward + stepReward
    }
}

export {MCTSNode, applyAction};