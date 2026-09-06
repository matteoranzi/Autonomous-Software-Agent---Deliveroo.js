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
        let newDesiredIntention: IDesire = (await this._strategy.select(desires))[0] ?? null;

        if (!newDesiredIntention?.isValid()) {
            return;
        }

        if (!this.committedDesire || !this.committedDesire.isValid()) {
            this.committedDesire = newDesiredIntention;
            return;
        }

        // If the new desired intention is the same kind of the committed desire,
        // but with a highest utility, then switch to the new desired intention
        if (newDesiredIntention?.name === this.committedDesire?.name
            && desireIdentity(newDesiredIntention) !== desireIdentity(this.committedDesire)) { // Guard-checking it isn't the same desire, but a different one of the same kind

            let newUtility = (await newDesiredIntention.evaluate()).utility;
            let committedUtility = (await this.committedDesire.evaluate()).utility;

            if (newUtility > committedUtility) {
                console.log(`Switching to new desired intention: ${desireIdentity(newDesiredIntention)}[${newUtility}] with higher utility than committed desire: ${desireIdentity(this.committedDesire)}[${committedUtility}]`);
                this.committedDesire = newDesiredIntention
            }
        }

        // if (this.committedDesire?.isValid()) {
        //     return;
        // }
        //
        // const selected = await this._strategy.select(desires);
        // this.committedDesire = selected[0] ?? null;
    }
}

export { Intention, desireIdentity };