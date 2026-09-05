import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class RivalAgentExitedDeliveryTileStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalExitedDeliveryTile';

    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.agents.exitedDeliveryTileIds.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {RivalAgentExitedDeliveryTileStrategy};