import {DeliberationContext, IChangeDetectionEstimator, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

// Interprets carriedByChangedIds into pickup/drop facts.
class ParcelCarriedByEstimator implements IChangeDetectionEstimator {
    readonly name = 'ParcelCarriedByEstimator';

    static readonly PICKED_UP = 'RivalPickedUpParcel';
    static readonly DROPPED = 'RivalDroppedParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const pickedUp: string[] = [];
        const dropped: string[] = [];

        for (const parcelId of context.parcels.carriedByChangedIds) {
            const parcel = context.belief.parcels.get(parcelId);
            if (!parcel) {
                continue;
            }
            if (parcel.carriedBy !== null) {
                pickedUp.push(parcelId);
            } else {
                dropped.push(parcelId);
            }
        }

        context.facts.set(ParcelCarriedByEstimator.PICKED_UP, {triggered: pickedUp.length > 0, degree: pickedUp.length > 0 ? 1 : 0});
        context.facts.set(ParcelCarriedByEstimator.DROPPED, {triggered: dropped.length > 0, degree: dropped.length > 0 ? 1 : 0});

        return {triggered: false, degree: 0};
    }
}

export {ParcelCarriedByEstimator};