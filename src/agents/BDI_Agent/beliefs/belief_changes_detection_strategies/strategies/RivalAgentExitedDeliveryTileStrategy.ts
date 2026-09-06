import {DeliberationContext, excludingAgent, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/estimators/AgentTileTransitionEstimator";

class RivalAgentExitedDeliveryTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalExitedDeliveryTile';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(AgentTileTransitionEstimator.EXITED_DELIVERY_TILE) ?? {triggered: false, degree: 0};
        return excludingAgent(fact, context.belief.me.id);
    }
}

export {RivalAgentExitedDeliveryTileStrategy};