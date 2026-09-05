import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class FreeParcelVanishedStrategy implements IChangeDetectionStrategy {
    readonly name = 'FreeParcelVanished';

    evaluate(context: DeliberationContext): StrategyResult {
        let triggered: boolean = false;
        context.parcels.vanishedParcels.some((parcelId) => {
            let parcel = context.belief.parcels.get(parcelId.id);
            if (parcel && parcel.carriedBy === null) {
                triggered = true;
                return true;
            }
        });

        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {FreeParcelVanishedStrategy};