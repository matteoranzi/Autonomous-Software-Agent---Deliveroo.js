import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {RivalAgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/RivalAgentTileTransitionEstimator";

class RivalAgentEnteredParcelTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalEnteredParcelTile';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(RivalAgentTileTransitionEstimator.ENTERED_PARCEL_TILE) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentEnteredParcelTileStrategy};