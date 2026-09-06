import {Goal, IDesire, IDesireEvaluation, PRIORITY} from "./IDesire";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";
import {PredictivePlanner} from "@/agents/BDI_Agent/planning/PredictivePlanner";

class DeliverParcelDesire implements IDesire {
    readonly name: string = "deliver_parcel_desire";

    goal: Goal;

    private readonly belief: Belief;
    private evaluationCache: IDesireEvaluation | null = null;


    constructor(belief: Belief, deliveryTilePosition: Position) {
        this.belief = belief;
        this.goal = {valid: true, position: deliveryTilePosition, finalAction: AgentActions.DROP};
    }

    // async evaluate(): Promise<IDesireEvaluation> {
    //     // if (this.evaluationCache) {
    //     //     return this.evaluationCache;
    //     // }
    //
    //     this.evaluationCache = await this.evaluate();
    //     return this.evaluationCache;
    // }

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

        const predictivePlanner = new PredictivePlanner(this.belief);
        const estimatedCost = await predictivePlanner.predictPlanCost(this.belief.me.position, this);

        return {
            utility: -estimatedCost,
            estimatedCost: estimatedCost,
            risk: 0,
            urgency: PRIORITY.HIGH,
            expectedReward: 0,
            category: this.name
        };
    }

    isValid(): boolean {
        if (!this.goal.valid) {
            return false;
        }

        if (this.belief.isAgentCarryingParcels(this.belief.me.id)
            && this.belief.positionWalkabilityLikelihood(this.goal.position)) {
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