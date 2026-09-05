import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/ParcelCarriedByEstimator";

class RivalAgentDroppedParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalAgentDroppedParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(ParcelCarriedByEstimator.DROPPED) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentDroppedParcelStrategy};