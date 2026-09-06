import {DeliberationContext, excludingAgent, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/estimators/ParcelCarriedByEstimator";

class RivalAgentPickedUpParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'rival_agent_picked_up_parcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(ParcelCarriedByEstimator.PICKED_UP) ?? {triggered: false, degree: 0};
        return excludingAgent(fact, context.belief.me.id);
    }
}

export {RivalAgentPickedUpParcelStrategy};