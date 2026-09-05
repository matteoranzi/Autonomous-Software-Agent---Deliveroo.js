import {
    DeliberationContext,
    IChangeDetectionStrategy,
    onlyAgent,
    StrategyResult
} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/ParcelCarriedByEstimator";

class SelfAgentDroppedParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'SelfAgentDroppedParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(ParcelCarriedByEstimator.DROPPED) ?? {triggered: false, degree: 0};
        return onlyAgent(fact, context.belief.me.id);
    }
}

export {SelfAgentDroppedParcelStrategy};