// DUMB EXPLORATION LOGIC FOR NOW, WILL BE REPLACED WITH A PROPER EXPLORATION LOGIC LATER

import {Goal, IDesire, IDesireEvaluation, PRIORITY} from "@/agents/BDI_Agent/desires/IDesire";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {PredictivePlanner} from "@/agents/BDI_Agent/planning/PredictivePlanner";


class ExploreParcelSpawningTileDesire implements IDesire {
    readonly name: string = "explore_parcel_spawning_tile";

    goal: Goal;

    private readonly belief: Belief;
    private evaluationCache: IDesireEvaluation | null = null;


    constructor(belief: Belief, parcelSpawnerTilePosition: Position) {
        this.belief = belief;
        this.goal = {valid: true, position: parcelSpawnerTilePosition, finalAction: null};
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
        if (!this.goal.valid) {
            return {
                utility: -Infinity,
                estimatedCost: Infinity,
                risk: 0,
                urgency: PRIORITY.LOW,
                expectedReward: 0,
                category: this.name
            };
        }

        const tile = this.belief.getTile(this.goal.position);
        if (!tile) {
            return {
                utility: -Infinity,
                estimatedCost: Infinity,
                risk: 0,
                urgency: PRIORITY.LOW,
                expectedReward: 0,
                category: this.name
            };
        }

        const predictivePlanner = new PredictivePlanner(this.belief);
        const estimatedCost = await predictivePlanner.predictPlanCost(this.belief.me.position, this);

        // Grows the longer this tile has gone unobserved - a benefit/urgency signal, not a cost.
        const age = Date.now() - tile.lastTimeObserved;
        const staleness = Math.pow(2, age / 900);

        return {
            utility: staleness,
            estimatedCost: estimatedCost,
            risk: 0,
            urgency: PRIORITY.LOW,
            expectedReward: 0,
            category: this.name
        };
    }

    isValid(): boolean {
        if (!this.goal.valid) {
            return false;
        }

        if (this.belief.isInsideObservingArea(this.goal.position)) {
            this.goal = {valid: false};
            return false;
        }

        return true;
    }

}

export {ExploreParcelSpawningTileDesire};