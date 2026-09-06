import {DeliberationContext, onlyAgent, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/estimators/AgentTileTransitionEstimator";

class SelfAgentExitedDeliveryTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'SelfExitedDeliveryTile';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(AgentTileTransitionEstimator.EXITED_DELIVERY_TILE) ?? {triggered: false, degree: 0};
        return onlyAgent(fact, context.belief.me.id);
    }
}

export {SelfAgentExitedDeliveryTileStrategy};