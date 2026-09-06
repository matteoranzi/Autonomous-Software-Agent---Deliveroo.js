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

    // TODO: Ingest commitment strategy (single-minded, multi-mind, etc.) and select a desire to commit to from the given desires.
    async deliberate(desires: IDesire[]): Promise<void> {
        if (this.committedDesire?.isValid()) {
            return;
        }

        const selected = await this._strategy.select(desires);
        this.committedDesire = selected[0] ?? null;
    }
}

export { Intention, desireIdentity };