import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class RivalAgentEnteredParcelTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalEnteredParcelTile';

    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.agents.enteredParcelTileIds.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {RivalAgentEnteredParcelTileStrategy};