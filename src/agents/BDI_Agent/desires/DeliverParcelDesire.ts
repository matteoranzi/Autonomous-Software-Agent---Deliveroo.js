import {Goal, IDesire, IDesireEvaluation, PRIORITY, DesireCategory} from "./IDesire";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";
import {CostEstimator} from "@/agents/BDI_Agent/planning/CostEstimator";

class DeliverParcelDesire implements IDesire {
    readonly name: string = "deliver_parcel_desire";
    readonly category: DesireCategory = DesireCategory.DELIVER;

    goal: Goal;

    private readonly belief: Belief;


    constructor(belief: Belief, deliveryTilePosition: Position) {
        this.belief = belief;
        this.goal = {valid: true, position: deliveryTilePosition, finalAction: AgentActions.DROP};
    }

    async evaluate(): Promise<IDesireEvaluation> {
        if (!this.goal.valid) {
            return {
                utility: -Infinity,
                estimatedCost: Infinity,
                risk: 0,
                urgency: PRIORITY.HIGH,
                expectedReward: 0,
                category:
                this.name
            };
        }

        const costEstimator = new CostEstimator(this.belief);
        const estimatedCost = await costEstimator.estimateCost(this.belief.me.position, this.goal.position);

        // The actual payoff of delivering: the sum of rewards of everything currently carried.
        let expectedReward = 0;
        for (const parcel of this.belief.parcels.values()) {
            if (parcel.carriedBy === this.belief.me.id) expectedReward += parcel.reward;
        }

        return {
            utility: -estimatedCost,
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

        if (this.belief.isAgentCarryingParcels(this.belief.me.id)
            && this.belief.isPositionWalkabilityLikelihood(this.goal.position)) {
            return true;
        }

        this.goal = {valid: false};
        return false;
    }

    // Class scoped method to determine if this kind of desire is applicable based on the current belief state.
    static isApplicable(belief: Belief): boolean {
        return belief.isAgentCarryingParcels(belief.me.id);
    }
}

export {DeliverParcelDesire};