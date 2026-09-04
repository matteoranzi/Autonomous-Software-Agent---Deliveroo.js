import {IDesire, IDesireEvaluation} from "./IDesire";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {manhattanDistance} from "@/agents/BDI_Agent/capabilities/utils";

class PickupDesire implements IDesire {
    readonly name: string;
    readonly goal: Position;
    readonly parcelId: string;

    belief: Belief;

    constructor(belief: Belief, parcelId: string) {
        this.name = "PickupDesire";
        this.parcelId = parcelId;
        this.belief = belief;
        let parcel = this.belief.parcels.get(this.parcelId);

        this.goal = parcel ? parcel.position : {x: 0, y: 0};
    }

    estimateValue(): number {
        return manhattanDistance(this.belief.me.position, this.goal);
    }

    evaluateValue(): Promise<IDesireEvaluation> {
        return Promise.resolve(undefined);
    }

    isValid(): boolean {
        let parcel = this.belief.parcels.get(this.parcelId);

        // Checks if the parcel still exists and is not being carried by another agent.
        if (parcel && !parcel.carriedBy) {
            // If the parcel is no longer in the same position as when the desire was formed, then the desire is no longer valid
            // and should invalidate that part of the intention (if it were actually being executed)
            return (parcel.position.x === this.goal.x &&
                parcel.position.y === this.goal.y)
        }
        return false;
    }
}

export { PickupDesire };