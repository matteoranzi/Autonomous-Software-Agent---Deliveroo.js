import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";

class NewParcelAppearedStrategy implements IChangeDetectionStrategy {
    readonly name = 'NewParcelAppeared';

    evaluate(context: DeliberationContext): StrategyResult {
        let triggered: boolean = false;
        context.parcels.newIds.some((parcelId) => {
            let parcel = context.belief.parcels.get(parcelId);
            if (parcel && parcel.carriedBy === null) {
                triggered = true;
                return true;
            }
        });

        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {NewParcelAppearedStrategy};