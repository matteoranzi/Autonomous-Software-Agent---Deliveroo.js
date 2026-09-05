import {IIntentionStrategy} from "@/agents/BDI_Agent/intentions/IIntentionStrategy";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";

class HighestScoreIntentionStrategy implements IIntentionStrategy {
    select(desires: IDesire[]): IDesire[] {
        return [...desires].sort((a, b) => b.estimateValue() - a.estimateValue());
    }

}

export { HighestScoreIntentionStrategy };