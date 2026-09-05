import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";


interface IIntentionStrategy {
    /**
     * Selects a subset of desires to form intentions based on the strategy's criteria.
     * @param desires
     * @returns A best-to-worst ordered subset of desires that have been selected as intentions.
     */
    select(desires: IDesire[]): IDesire[];
}

export {IIntentionStrategy}