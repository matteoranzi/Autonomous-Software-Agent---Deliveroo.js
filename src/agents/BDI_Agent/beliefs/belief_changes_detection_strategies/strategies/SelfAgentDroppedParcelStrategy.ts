import {
    DeliberationContext,
    IChangeDetectionStrategy,
    onlyAgent,
    StrategyResult
} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/estimators/ParcelCarriedByEstimator";

class SelfAgentDroppedParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'self_agent_dropped_parcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(ParcelCarriedByEstimator.DROPPED) ?? {triggered: false, degree: 0};
        return onlyAgent(fact, context.belief.me.id);
    }
}

export {SelfAgentDroppedParcelStrategy};