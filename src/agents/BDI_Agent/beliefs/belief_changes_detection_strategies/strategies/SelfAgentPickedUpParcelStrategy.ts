import {
    DeliberationContext,
    IChangeDetectionStrategy,
    onlyAgent,
    StrategyResult
} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/estimators/ParcelCarriedByEstimator";

class SelfAgentPickedUpParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'SelfAgentPickedUpParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(ParcelCarriedByEstimator.PICKED_UP) ?? {triggered: false, degree: 0};
        return onlyAgent(fact, context.belief.me.id);
    }
}

export {SelfAgentPickedUpParcelStrategy};