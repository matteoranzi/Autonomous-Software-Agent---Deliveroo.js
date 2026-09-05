import {DeliberationContext, onlyAgent, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/AgentTileTransitionEstimator";

class SelfAgentExitedParcelTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'SelfExitedParcelTile';

    evaluate(context: DeliberationContext): StrategyResult {
        const fact = context.facts.get(AgentTileTransitionEstimator.EXITED_PARCEL_TILE) ?? {triggered: false, degree: 0};
        return onlyAgent(fact, context.belief.me.id);
    }
}

export {SelfAgentExitedParcelTileStrategy};