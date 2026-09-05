import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class CrateMovedStrategy implements IChangeDetectionStrategy {
    readonly name: string = "CrateMovedStrategy";

    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.crates.movedCrateIds.length > 0 || context.crates.discardedSeedPositions.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {CrateMovedStrategy};