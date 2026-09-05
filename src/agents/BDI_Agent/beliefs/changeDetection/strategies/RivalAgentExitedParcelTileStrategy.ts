import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/AgentTileTransitionEstimator";

class RivalAgentExitedParcelTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalExitedParcelTile';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(AgentTileTransitionEstimator.EXITED_PARCEL_TILE) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentExitedParcelTileStrategy};