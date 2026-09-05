import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class RivalAgentEnteredDeliveryTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalEnteredDeliveryTile';

    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.agents.enteredDeliveryTileIds.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {RivalAgentEnteredDeliveryTileStrategy};