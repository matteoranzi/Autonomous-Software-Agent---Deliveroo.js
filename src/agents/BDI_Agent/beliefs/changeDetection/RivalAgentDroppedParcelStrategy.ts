import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class RivalAgentDroppedParcelStrategy implements IChangeDetectionStrategy {
    readonly name = 'RivalAgentDroppedParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        let triggered: boolean = false;

        context.parcels.carriedByChangedIds.some((parcelId) => {
            let parcel = context.belief.parcels.get(parcelId);
            if (parcel && parcel.carriedBy === null) {
                triggered = true;
                return true;
            }
        });

        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {RivalAgentDroppedParcelStrategy};