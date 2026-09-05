import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/AgentTileTransitionEstimator";

class RivalAgentEnteredDeliveryTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalEnteredDeliveryTile';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(AgentTileTransitionEstimator.ENTERED_DELIVERY_TILE) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentEnteredDeliveryTileStrategy};