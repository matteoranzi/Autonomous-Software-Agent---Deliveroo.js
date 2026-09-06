import {DeliberationContext, onlyAgent, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/estimators/ParcelCarriedByEstimator";

class SelfAgentDeliveredParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'SelfAgentDeliveredParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(ParcelCarriedByEstimator.DELIVERED) ?? {triggered: false, degree: 0};
        return onlyAgent(fact, context.belief.me.id);
    }
}

export {SelfAgentDeliveredParcelStrategy};