import {DeliberationContext, IChangeDetectionEstimator, ParcelVanishReason, StrategyResult} from "@/agents/BDI_Agent/beliefs/changes_detection_strategies/IChangeDetectionStrategy";

// Interprets carriedByChanged/vanished into pickup/drop/delivered facts, for self and rivals alike.
class ParcelCarriedByEstimator implements IChangeDetectionEstimator {
    readonly name = 'parcel_carried_by_estimator';

    static readonly PICKED_UP = 'AgentPickedUpParcel';
    static readonly DROPPED = 'AgentDroppedParcel';
    static readonly DELIVERED = 'AgentDeliveredParcel';

    evaluate(context: DeliberationContext): StrategyResult {
        const pickedUpBy: string[] = [];
        const droppedBy: string[] = [];
        const deliveredBy: string[] = [];

        for (const changed of context.parcels.carriedByChanged) {
            if (changed.to !== null) {
                pickedUpBy.push(changed.to);
            }
            if (changed.from !== null) {
                droppedBy.push(changed.from);
            }
        }

        // A carried parcel that vanishes on a delivery tile was removed by the game on delivery,
        // not dropped via carriedByChanged (the game deletes it outright instead of setting carriedBy to null).
        for (const vanished of context.parcels.vanished) {
            if (vanished.carriedBy !== null
                && vanished.reason === ParcelVanishReason.Unobserved
                && context.belief.map.grid[vanished.position.x][vanished.position.y].isParcelDelivery) {
                deliveredBy.push(vanished.carriedBy);
            }
        }

        context.facts.set(ParcelCarriedByEstimator.PICKED_UP, {triggered: pickedUpBy.length > 0, degree: pickedUpBy.length > 0 ? 1 : 0, agentIds: pickedUpBy});
        context.facts.set(ParcelCarriedByEstimator.DROPPED, {triggered: droppedBy.length > 0, degree: droppedBy.length > 0 ? 1 : 0, agentIds: droppedBy});
        context.facts.set(ParcelCarriedByEstimator.DELIVERED, {triggered: deliveredBy.length > 0, degree: deliveredBy.length > 0 ? 1 : 0, agentIds: deliveredBy});

        return {triggered: false, degree: 0};
    }
}

export {ParcelCarriedByEstimator};