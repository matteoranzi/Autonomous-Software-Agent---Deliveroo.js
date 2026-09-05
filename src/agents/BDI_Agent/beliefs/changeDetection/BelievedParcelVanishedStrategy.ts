import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class BelievedParcelVanishedStrategy implements IChangeDetectionStrategy {
    readonly name = 'BelievedParcelVanished';

    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.parcels.vanishedParcels.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {BelievedParcelVanishedStrategy};