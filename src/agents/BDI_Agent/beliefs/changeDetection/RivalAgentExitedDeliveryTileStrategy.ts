import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/AgentTileTransitionEstimator";

class RivalAgentExitedDeliveryTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalExitedDeliveryTile';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(AgentTileTransitionEstimator.EXITED_DELIVERY_TILE) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentExitedDeliveryTileStrategy};