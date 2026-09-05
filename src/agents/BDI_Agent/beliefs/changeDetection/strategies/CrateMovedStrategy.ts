import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class CrateMovedStrategy implements IChangeDetectionStrategy {
    readonly name: string = "CrateMoved";

    //FIXME: Should it trigger only if the crate was moved by a rival agent? Currently it triggers if the crate was moved by any agent, including the agent itself.
    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.crates.moved.length > 0 || context.crates.discardedSeedPositions.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {CrateMovedStrategy};