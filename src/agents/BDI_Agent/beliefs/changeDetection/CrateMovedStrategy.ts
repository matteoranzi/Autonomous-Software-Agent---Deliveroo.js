import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class CrateMovedStrategy implements IChangeDetectionStrategy {
    readonly name: string = "CrateMoved";

    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.crates.moved.length > 0 || context.crates.discardedSeedPositions.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {CrateMovedStrategy};