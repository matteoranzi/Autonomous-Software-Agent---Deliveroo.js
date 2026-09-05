import {DeliberationContext, IChangeDetectionEstimator, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

// Interprets carriedByChangedIds into pickup/drop facts.
class ParcelCarriedByRivalAgentEstimator implements IChangeDetectionEstimator {
    readonly name = 'ParcelCarriedByEstimator';

    static readonly PICKED_UP = 'RivalPickedUpParcel';
    static readonly DROPPED = 'RivalDroppedParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const pickedUp: string[] = [];
        const dropped: string[] = [];

        for (const changedParcel of context.parcels.carriedByChanged) {
            const parcel = context.belief.parcels.get(changedParcel.id);

            if (!parcel || changedParcel.from === context.belief.me.id || changedParcel.to === context.belief.me.id) {
                continue;
            }

            if (parcel.carriedBy !== null) {
                pickedUp.push(changedParcel.id);
            } else {
                dropped.push(changedParcel.id);
            }
        }

        context.facts.set(ParcelCarriedByRivalAgentEstimator.PICKED_UP, {triggered: pickedUp.length > 0, degree: pickedUp.length > 0 ? 1 : 0});
        context.facts.set(ParcelCarriedByRivalAgentEstimator.DROPPED, {triggered: dropped.length > 0, degree: dropped.length > 0 ? 1 : 0});

        return {triggered: false, degree: 0};
    }
}

export {ParcelCarriedByRivalAgentEstimator};