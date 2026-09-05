import {DeliberationContext, excludingAgent, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/ParcelCarriedByEstimator";

class RivalAgentDeliveredParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalAgentDeliveredParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(ParcelCarriedByEstimator.DELIVERED) ?? {triggered: false, degree: 0};
        return excludingAgent(fact, context.belief.me.id);
    }
}

export {RivalAgentDeliveredParcelStrategy};