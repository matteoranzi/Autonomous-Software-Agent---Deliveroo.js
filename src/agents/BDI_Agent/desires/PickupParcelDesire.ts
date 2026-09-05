import {Goal, IDesire, IDesireEvaluation} from "./IDesire";
import {Belief} from "@/agents/BDI_Agent/beliefs/Belief";
import {positionsEqual} from "@/agents/BDI_Agent/capabilities/utils";

class PickupParcelDesire implements IDesire {
    readonly name: string = "PickupParcelDesire";
    readonly parcelId: string;

    belief: Belief;
    goal: Goal;

    constructor(belief: Belief, parcelId: string) {
        this.parcelId = parcelId;
        this.belief = belief;
        let parcel = this.belief.parcels.get(this.parcelId);

        this.goal = parcel ? {valid: true, position: parcel.position} : {valid: false};
    }

    estimateValue(): number {
        return 1;
    }

    evaluateValue(): Promise<IDesireEvaluation> {
        throw new Error("PickupParcelDesire.evaluateValue is not implemented yet");
    }

    isValid(): boolean {
        if (!this.goal.valid) {
            return false;
        }

        let parcel = this.belief.parcels.get(this.parcelId);

        // Checks if the parcel still exists and is not being carried by another agent (and the position is walkable).
        if (parcel && !parcel.carriedBy && this.belief.isPositionCurrentlyWalkable(parcel.position)) {
            // If the parcel is no longer in the same position as when the desire was formed, then the desire is no longer valid
            // and should invalidate that part of the intention (if it were actually being executed)

            if (positionsEqual(parcel.position, this.goal.position)) {
                return true;
            }
        }

        this.goal = {valid: false};

        return false;
    }
}

export { PickupParcelDesire };