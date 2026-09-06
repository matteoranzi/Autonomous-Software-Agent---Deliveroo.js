import {IIntentionStrategy} from "@/agents/BDI_Agent/intentions/IIntentionStrategy";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {Belief} from "@/agents/BDI_Agent/beliefs/Belief";
import {PickupParcelDesire} from "@/agents/BDI_Agent/desires/PickupParcelDesire";
import {DeliverParcelDesire} from "@/agents/BDI_Agent/desires/DeliverParcelDesire";
import {ExploreParcelSpawningTileDesire} from "@/agents/BDI_Agent/desires/ExploreParcelSpawningTileDesire";

class GreedyIntentionStrategy implements IIntentionStrategy {
    readonly name: string = "greedy_intention";

    private readonly belief: Belief;
    private readonly carryingCapacity: number;

    constructor(belief: Belief, carryingCapacity: number = 4) {
        this.belief = belief;
        this.carryingCapacity = carryingCapacity;
    }

    async select(desires: IDesire[]): Promise<IDesire[]> {
        if (desires.length === 0) {
            return [];
        }

        const pickupDesires: PickupParcelDesire[] = [];
        const deliverDesires: DeliverParcelDesire[] = [];
        const visitDesires: ExploreParcelSpawningTileDesire[] = [];

        for (const desire of desires) {
            if (desire instanceof PickupParcelDesire) pickupDesires.push(desire);
            else if (desire instanceof DeliverParcelDesire) deliverDesires.push(desire);
            else if (desire instanceof ExploreParcelSpawningTileDesire) visitDesires.push(desire);
        }

        let carriedParcels = 0;
        for (const parcel of this.belief.parcels.values()) {
            if (parcel.carriedBy === this.belief.me.id) carriedParcels++;
        }

        // Helper function to find the desire with the highest utility in a given bucket.
        const best = async (bucket: IDesire[]): Promise<IDesire> => {
            const scored = await Promise.all(bucket.map(async (desire: IDesire) => ({desire, value: (await desire.evaluate()).utility})));
            return scored.reduce((top, current) => current.value > top.value ? current : top).desire;
        };

        // At capacity: offload before anything else, even if there's still something to pick up or explore.
        if (carriedParcels >= this.carryingCapacity && deliverDesires.length > 0) {
            return [await best(deliverDesires)];
        }

        // Room to carry more, and something available to grab.
        if (pickupDesires.length > 0) {
            return [await best(pickupDesires)];
        }

        if (deliverDesires.length > 0) {
            return [await best(deliverDesires)];
        }

        // Nothing to pick up right now (and not stuck at capacity) - go explore.
        if (visitDesires.length > 0) {
            return [await best(visitDesires)];
        }

        return [];
    }
}

export { GreedyIntentionStrategy };