import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {RivalAgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/RivalAgentTileTransitionEstimator";

class RivalAgentExitedDeliveryTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalExitedDeliveryTile';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(RivalAgentTileTransitionEstimator.EXITED_DELIVERY_TILE) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentExitedDeliveryTileStrategy};