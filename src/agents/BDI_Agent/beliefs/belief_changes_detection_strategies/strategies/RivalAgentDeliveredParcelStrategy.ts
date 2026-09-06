import {DeliberationContext, excludingAgent, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/estimators/ParcelCarriedByEstimator";

class RivalAgentDeliveredParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'rival_agent_delivered_parcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(ParcelCarriedByEstimator.DELIVERED) ?? {triggered: false, degree: 0};
        return excludingAgent(fact, context.belief.me.id);
    }
}

export {RivalAgentDeliveredParcelStrategy};