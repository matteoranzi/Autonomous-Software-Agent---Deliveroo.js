import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class RivalAgentExitedParcelTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalExitedParcelTile';

    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.agents.exitedParcelTileIds.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {RivalAgentExitedParcelTileStrategy};