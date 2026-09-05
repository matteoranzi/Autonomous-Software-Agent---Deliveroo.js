import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class RivalEnteredDeliveryTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalEnteredDeliveryTile';

    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.agents.enteredOrExitedDeliveryTileIds.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {RivalEnteredDeliveryTileStrategy};