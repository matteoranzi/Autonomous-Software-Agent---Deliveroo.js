import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changes_detection_strategies/IChangeDetectionStrategy";

class FreeParcelVanishedStrategy implements IChangeDetectionStrategy {
    readonly name = 'FreeParcelVanished';

    evaluate(context: DeliberationContext): StrategyResult {
        let triggered = context.parcels.vanished.some(parcel => {
            return parcel.carriedBy === null;
        });

        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {FreeParcelVanishedStrategy};