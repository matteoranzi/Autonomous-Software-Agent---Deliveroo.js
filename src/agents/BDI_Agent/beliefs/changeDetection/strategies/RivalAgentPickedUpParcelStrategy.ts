import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/ParcelCarriedByEstimator";

class RivalAgentPickedUpParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalAgentPickedUpParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(ParcelCarriedByEstimator.PICKED_UP) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentPickedUpParcelStrategy};