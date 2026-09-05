import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {ParcelCarriedByRivalAgentEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/ParcelCarriedByRivalAgentEstimator";

class RivalAgentPickedUpParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalAgentPickedUpParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(ParcelCarriedByRivalAgentEstimator.PICKED_UP) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentPickedUpParcelStrategy};