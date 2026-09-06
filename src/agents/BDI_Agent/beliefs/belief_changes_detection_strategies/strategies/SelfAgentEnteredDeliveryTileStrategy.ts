import {DeliberationContext, onlyAgent, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/estimators/AgentTileTransitionEstimator";

class SelfAgentEnteredDeliveryTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'SelfEnteredDeliveryTile';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(AgentTileTransitionEstimator.ENTERED_DELIVERY_TILE) ?? {triggered: false, degree: 0};
        return onlyAgent(fact, context.belief.me.id);
    }
}

export {SelfAgentEnteredDeliveryTileStrategy};