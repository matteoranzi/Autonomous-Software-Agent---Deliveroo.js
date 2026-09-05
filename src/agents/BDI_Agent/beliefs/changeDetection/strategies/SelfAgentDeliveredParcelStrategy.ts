import {DeliberationContext, onlyAgent, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/ParcelCarriedByEstimator";

class SelfAgentDeliveredParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'SelfAgentDeliveredParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(ParcelCarriedByEstimator.DELIVERED) ?? {triggered: false, degree: 0};
        return onlyAgent(fact, context.belief.me.id);
    }
}

export {SelfAgentDeliveredParcelStrategy};