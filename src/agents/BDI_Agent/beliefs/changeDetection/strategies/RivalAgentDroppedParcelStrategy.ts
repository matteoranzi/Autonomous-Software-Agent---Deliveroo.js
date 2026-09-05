import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {ParcelCarriedByRivalAgentEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/ParcelCarriedByRivalAgentEstimator";

class RivalAgentDroppedParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalAgentDroppedParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(ParcelCarriedByRivalAgentEstimator.DROPPED) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentDroppedParcelStrategy};