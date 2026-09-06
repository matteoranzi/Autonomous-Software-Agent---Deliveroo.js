import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {IIntentionStrategy} from "@/agents/BDI_Agent/intentions/IIntentionStrategy";

import {
    IReconsiderationStrategy
} from "@/agents/BDI_Agent/intentions/reconsideration_policies/IReconsiderationStrategy";


class Intention {
    private readonly _intentionStrategy: IIntentionStrategy;
    private readonly _reconsiderationStrategy: IReconsiderationStrategy

    committedDesire: IDesire | null = null;

    constructor(intentionStrategy: IIntentionStrategy, reconsiderationStrategy: IReconsiderationStrategy) {
        this._intentionStrategy = intentionStrategy;
        this._reconsiderationStrategy = reconsiderationStrategy;
    }

    async deliberate(desires: IDesire[]): Promise<void> {
        if (!this.committedDesire || !this.committedDesire.isValid()) {
            this.committedDesire = (await this._intentionStrategy.select(desires))[0] ?? null;
        }

        if (!this.committedDesire) {
            return;
        }

        this.committedDesire = await this._reconsiderationStrategy.reconsider(this.committedDesire, desires);
    }
}

export { Intention };