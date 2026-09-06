import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {IIntentionStrategy} from "@/agents/BDI_Agent/intentions/IIntentionStrategy";

// Desires are re-instantiated from scratch every regenerate() cycle, so comparing them by
// name + goal position instead, which is stable across regenerations.
function desireIdentity(desire: IDesire | null): string {
    if (!desire || !desire.goal.valid) {
        return "none";
    }
    return `${desire.name}:${desire.goal.position.x},${desire.goal.position.y}`;
}

class Intention {
    // FIXME: is it an "intention strategy" or a planner? (e.g., MCTS planner)
    private readonly _strategy: IIntentionStrategy;

    committedDesire: IDesire | null = null;

    constructor(strategy: IIntentionStrategy) {
        this._strategy = strategy;
    }

    // Single-minded commitment
    // TODO: ingestion of deliberation strategy
    //  e.g., Monte Carlo Tree Search (MCTS) to evaluate the best desire to commit to, based on the current belief, desires and current intention

    // Returns true iff the commitment changed to a different real-world target
    deliberate(desires: IDesire[]): void {
        if (this.committedDesire?.isValid()) {
            return;
        }

        this.committedDesire =  this._strategy.select(desires)[0] ?? null;;
        return;
    }
}

export { Intention, desireIdentity };