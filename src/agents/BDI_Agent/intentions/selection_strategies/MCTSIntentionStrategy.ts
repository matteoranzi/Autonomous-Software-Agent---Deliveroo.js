import {IIntentionStrategy} from "@/agents/BDI_Agent/intentions/selection_strategies/IIntentionStrategy";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {Belief} from "@/agents/BDI_Agent/beliefs/Belief";
import {SimulationState} from "@/agents/BDI_Agent/intentions/selection_strategies/mcts/SimulationState";
import {CostEstimator} from "@/agents/BDI_Agent/planning/CostEstimator";
import {FuzzyDesirabilityScorer} from "@/agents/BDI_Agent/intentions/fuzzy_logic/FuzzyDesirabilityScorer";
import {MCTSNode} from "@/agents/BDI_Agent/intentions/selection_strategies/mcts/MCTSNode";
import {
    backpropagate,
    expand,
    rollout,
    selectChild
} from "@/agents/BDI_Agent/intentions/selection_strategies/mcts/MCTSSearch";

class MCTSIntentionStrategy implements IIntentionStrategy {
    readonly name: string = "monte_carlo_tree_search_intention";

    private readonly belief: Belief;
    private readonly iterations: number;
    private readonly maxDepth: number;
    private readonly explorationConstant: number;

    constructor(belief: Belief, iterations: number = 50, maxDepth: number = 5, explorationConstant: number = Math.SQRT2) {
        this.belief = belief;
        this.iterations = iterations;
        this.maxDepth = maxDepth;
        this.explorationConstant = explorationConstant;
    }

    async select(desires: IDesire[]): Promise<IDesire[]> {
        if (desires.length === 0) {
            return [];
        }

        let carriedCount = 0;
        for (const parcel of this.belief.parcels.values()) {
            if (parcel.carriedBy === this.belief.me.id) carriedCount++;
        }

        const rootState: SimulationState = {
            belief: this.belief,
            position: this.belief.me.position,
            carriedCount: carriedCount,
            visited: new Set<string>(),
            accumulatedReward: 0
        }

        const costEstimator = new CostEstimator(this.belief);
        const scorer = new FuzzyDesirabilityScorer(this.belief);
        const root = new MCTSNode(rootState, null, null, desires);

        for (let i = 0; i < this.iterations; i++) {
            let node = root;

            // Selection: keep descending the exising tree via UCB1 only while fully expanded
            while (node.isFullyExpanded && node.children.length > 0 && node.state.visited.size < this.maxDepth) {
                node = selectChild(node, this.explorationConstant);
            }

            // Expansion: only reached when node still has untried actions and isn't depth-capped
            if (!node.isFullyExpanded && node.state.visited.size < this.maxDepth) {
                node = await expand(node, desires, costEstimator, scorer);
            }

            // Simulation: random rollout from wherever Selection / Expansion landed
            const reward = await rollout(node.state, desires, costEstimator, scorer, this.maxDepth);

            backpropagate(node, reward);
        }

        if (root.children.length === 0) {
            return [];
        }

        // Calibration instrumentation - visit distribution across root children tells us whether
        // explorationConstant over/under-exploits relative to the iteration budget.
        const sorted = [...root.children].sort((a, b) => b.visits - a.visits);
        const totalVisits = sorted.reduce((sum, c) => sum + c.visits, 0);
        console.log("[MCTS-CALIBRATE]", JSON.stringify({
            rootChildren: root.children.length,
            totalVisits,
            top3: sorted.slice(0, 3).map((c) => ({desire: c.desireTaken?.name, visits: c.visits, avgReward: Number(c.averageReward.toFixed(2))})),
        }));

        // Robust child: most-visited, not highest average reward
        const bestChild = root.children.reduce((best, child) => child.visits > best.visits ? child : best);
        return bestChild.desireTaken ? [bestChild.desireTaken] : [];
    }
}

export {MCTSIntentionStrategy}
