import {Goal, IDesire, IDesireEvaluation, PRIORITY, DesireCategory} from "./IDesire";
import {Belief} from "@/agents/BDI_Agent/beliefs/Belief";
import {positionsEqual} from "@/agents/BDI_Agent/utils";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";
import {CostEstimator} from "@/agents/BDI_Agent/planning/CostEstimator";

class PickupParcelDesire implements IDesire {
    readonly name: string = "pick_up_parcel_desire";
    readonly category: DesireCategory = DesireCategory.PICKUP;

    readonly parcelId: string;

    goal: Goal;

    private readonly belief: Belief;

    constructor(belief: Belief, parcelId: string) {
        this.parcelId = parcelId;
        this.belief = belief;
        let parcel = this.belief.parcels.get(this.parcelId);

        this.goal = parcel ? {
            valid: true,
            position: parcel.position,
            finalAction: AgentActions.PICKUP
        } : {valid: false};
    }

    async evaluate(): Promise<IDesireEvaluation> {
        let desireEvaluation = {
            utility: -Infinity,
            estimatedCost: Infinity,
            risk: 0,
            urgency: PRIORITY.MEDIUM,
            expectedReward: 0,
            category: this.name
        };

        const parcel = this.belief.parcels.get(this.parcelId);
        if (!parcel) {
            return desireEvaluation;
        }

        if (!this.goal.valid) {
            return desireEvaluation;
        }

        const costEstimator = new CostEstimator(this.belief);
        const estimatedCost = await costEstimator.estimateCost(this.belief.me.position, this.goal.position);
        const expectedReward = parcel.reward;

        desireEvaluation["utility"] = Math.log(expectedReward) / Math.log(estimatedCost + 1);
        desireEvaluation["estimatedCost"] = estimatedCost;
        desireEvaluation["expectedReward"] = expectedReward;

        return desireEvaluation;
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

export {PickupParcelDesire};