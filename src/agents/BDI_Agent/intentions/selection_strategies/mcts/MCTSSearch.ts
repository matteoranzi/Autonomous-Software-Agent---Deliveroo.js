import {applyAction, MCTSNode} from "@/agents/BDI_Agent/intentions/selection_strategies/mcts/MCTSNode";
import {CostEstimator} from "@/agents/BDI_Agent/planning/CostEstimator";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {
    availableActions,
    SimulationState
} from "@/agents/BDI_Agent/intentions/selection_strategies/mcts/SimulationState";

// Upper Confidence Bound 1 (UCB1) formula for MCTS node selection
function ucb1(child: MCTSNode, parentVisits: number, explorationConstant: number): number {
    if (child.visits === 0) {
        return Infinity; // Encourage exploration of unvisited nodes
    }
    return child.averageReward + explorationConstant * Math.sqrt(Math.log(parentVisits) / child.visits);
}

function selectChild(node: MCTSNode, explorationConstant: number) : MCTSNode {
    return node.children.reduce((best, child) => {
        return ucb1(child, node.visits, explorationConstant) > ucb1(best, node.visits, explorationConstant) ? child : best;
    })
}

async function expand(node: MCTSNode, allDesires: IDesire[], costEstimator: CostEstimator): Promise<MCTSNode> {
    const desire = node.untriedActions.pop();

    if (!desire) {
        throw new Error("expand: called on a node with no untried actions. The caller should check node.isFullyExpanded first.");
    }

    const childState = await applyAction(node.state, desire, costEstimator);
    const child = new MCTSNode(childState, desire, node, allDesires);
    node.children.push(child);

    return child;
}


// Random rollout simulation from startState until maxDepth.
// Deliveroo game has no terminal state, so no terminal-state concept needed.
async function rollout(startState: SimulationState, allDesires: IDesire[], costEstimator: CostEstimator, maxDepth: number): Promise<number> {
    let state = startState;

    // Depth tracked via visited.size since it grows one per step taken from the root
    while(state.visited.size < maxDepth) {
        const actions = availableActions(state, allDesires);
        if (actions.length === 0) {
            break; // nothing left to simulate. Early stop
        }

        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        state = await applyAction(state, randomAction, costEstimator);
    }

    return state.accumulatedReward;
}

function backpropagate (node: MCTSNode, reward: number): void {
    let currentNode: MCTSNode | null = node;
    while (currentNode !== null) {
        currentNode.visits += 1;
        currentNode.totalReward += reward;
        currentNode = currentNode.parent;
    }
}

export {selectChild, expand, rollout, backpropagate};