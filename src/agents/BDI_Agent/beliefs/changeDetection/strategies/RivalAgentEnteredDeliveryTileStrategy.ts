import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {RivalAgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/RivalAgentTileTransitionEstimator";

class RivalAgentEnteredDeliveryTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalEnteredDeliveryTile';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(RivalAgentTileTransitionEstimator.ENTERED_DELIVERY_TILE) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentEnteredDeliveryTileStrategy};