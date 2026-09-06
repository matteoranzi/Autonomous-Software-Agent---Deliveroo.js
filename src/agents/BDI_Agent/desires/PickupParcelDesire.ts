import {Goal, IDesire, IDesireEvaluation, PRIORITY} from "./IDesire";
import {Belief} from "@/agents/BDI_Agent/beliefs/Belief";
import {positionsEqual} from "@/agents/BDI_Agent/utils";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";
import {PredictivePlanner} from "@/agents/BDI_Agent/planning/PredictivePlanner";

class PickupParcelDesire implements IDesire {
    readonly name: string = "pick_up_parcel_desire";
    readonly parcelId: string;

    goal: Goal;

    private readonly belief: Belief;
    private evaluationCache: IDesireEvaluation | null = null;


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

    // async evaluation(): Promise<IDesireEvaluation> {
    //     if (this.evaluationCache) {
    //         return this.evaluationCache;
    //     }
    //
    //     this.evaluationCache = await this.evaluate();
    //     return this.evaluationCache;
    // }

    async evaluate(): Promise<IDesireEvaluation> {
        const parcel = this.belief.parcels.get(this.parcelId);
        if (!parcel) {
            return {
                utility: -Infinity,
                estimatedCost: Infinity,
                risk: 0,
                urgency: PRIORITY.MEDIUM,
                expectedReward: 0,
                category: this.name
            };
        }

        const predictivePlanner = new PredictivePlanner(this.belief);
        const estimatedCost = await predictivePlanner.predictPlanCost(this.belief.me.position, this);
        const expectedReward = parcel.reward;

        return {
            utility: Math.log(expectedReward) / Math.log(estimatedCost + 1),
            estimatedCost: estimatedCost,
            risk: 0,
            urgency: PRIORITY.MEDIUM,
            expectedReward,
            category: this.name
        };
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