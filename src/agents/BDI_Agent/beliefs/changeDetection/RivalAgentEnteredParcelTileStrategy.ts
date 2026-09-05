import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/AgentTileTransitionEstimator";

class RivalAgentEnteredParcelTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalEnteredParcelTile';

    evaluate(context: DeliberationContext): StrategyResult {
        return context.facts.get(AgentTileTransitionEstimator.ENTERED_PARCEL_TILE) ?? {triggered: false, degree: 0};
    }
}

export {RivalAgentEnteredParcelTileStrategy};