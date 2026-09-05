import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class ParcelCarriedByChangedStrategy implements IChangeDetectionStrategy {
    readonly name = 'ParcelCarriedByChanged';

    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.parcels.carriedByChangedIds.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {ParcelCarriedByChangedStrategy};