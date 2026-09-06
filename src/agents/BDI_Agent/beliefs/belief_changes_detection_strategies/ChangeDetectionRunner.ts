import {DeliberationContext, IChangeDetectionStrategy, TriggeredStrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";

// Executes an ordered list of change-detection strategies against one cycle's context.
class ChangeDetectionRunner {
    private readonly strategies: IChangeDetectionStrategy[];

    constructor(strategies: IChangeDetectionStrategy[]) {
        this.strategies = strategies;
    }

    run(context: DeliberationContext): TriggeredStrategyResult[] {
        const triggeredResults: TriggeredStrategyResult[] = [];

        for (const strategy of this.strategies) {
            const result = strategy.evaluate(context);
            context.facts.set(strategy.name, result);

            if (result.triggered) {
                triggeredResults.push({name: strategy.name, ...result});
            }
        }

        return triggeredResults;
    }
}

export {ChangeDetectionRunner};