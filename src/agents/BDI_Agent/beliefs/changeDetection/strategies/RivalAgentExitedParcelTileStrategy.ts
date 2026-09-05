import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {RivalAgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/RivalAgentTileTransitionEstimator";

class RivalAgentExitedParcelTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalExitedParcelTile';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(RivalAgentTileTransitionEstimator.EXITED_PARCEL_TILE) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentExitedParcelTileStrategy};