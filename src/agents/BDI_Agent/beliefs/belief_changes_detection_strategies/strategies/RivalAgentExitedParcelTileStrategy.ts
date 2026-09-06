import {DeliberationContext, excludingAgent, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/estimators/AgentTileTransitionEstimator";

class RivalAgentExitedParcelTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'rival_agent_exited_parcel_tile';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(AgentTileTransitionEstimator.EXITED_PARCEL_TILE) ?? {triggered: false, degree: 0};
        return excludingAgent(fact, context.belief.me.id);
    }
}

export {RivalAgentExitedParcelTileStrategy};