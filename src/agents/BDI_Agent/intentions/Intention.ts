import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {IIntentionStrategy} from "@/agents/BDI_Agent/intentions/IIntentionStrategy";

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
    deliberate(desires: IDesire[]): boolean {
        if (this.committedDesire?.isValid()) {
            return false;
        }

        let newCommittedDesire = this._strategy.select(desires)[0] ?? null;
        if (newCommittedDesire !== this.committedDesire) {
            this.committedDesire = newCommittedDesire;
            return true;
        }

        return false;
    }
}

export { Intention };