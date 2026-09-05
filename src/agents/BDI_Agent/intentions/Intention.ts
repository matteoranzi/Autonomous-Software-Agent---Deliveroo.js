import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {IIntentionStrategy} from "@/agents/BDI_Agent/intentions/IIntentionStrategy";

class Intention {
    // FIXME: is it an "intention strategy" or a planner? (e.g., MCTS planner)
    private readonly _strategy: IIntentionStrategy;

    currentDesire: IDesire | null = null;

    constructor(strategy: IIntentionStrategy) {
        this._strategy = strategy;
    }

    // Single-minded commitment
    // TODO: ingestion of deliberation strategy
    deliberate(desires: IDesire[]): IDesire | null {
        if (this.currentDesire?.isValid()) {
            return this.currentDesire
        }

        this.currentDesire = this._strategy.select(desires)[0] ?? null;

        return this.currentDesire;
    }
}

export { Intention };