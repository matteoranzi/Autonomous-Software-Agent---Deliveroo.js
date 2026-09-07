import {
    DeliberationContext,
    IChangeDetectionStrategy,
    onlyAgent,
    StrategyResult
} from "@/agents/BDI_Agent/beliefs/changes_detection_strategies/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/changes_detection_strategies/estimators/ParcelCarriedByEstimator";

class SelfAgentPickedUpParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'self_agent_picked_up_parcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(ParcelCarriedByEstimator.PICKED_UP) ?? {triggered: false, degree: 0};
        return onlyAgent(fact, context.belief.me.id);
    }
}

export {SelfAgentPickedUpParcelStrategy};