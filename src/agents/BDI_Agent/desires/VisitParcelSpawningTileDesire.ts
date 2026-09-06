// DUMB EXPLORATION LOGIC FOR NOW, WILL BE REPLACED WITH A PROPER EXPLORATION LOGIC LATER

import {Goal, IDesire, IDesireEvaluation} from "@/agents/BDI_Agent/desires/IDesire";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";

class VisitParcelSpawningTileDesire implements IDesire{
    readonly name: string = "visit_parcel_spawning_tile";

    belief: Belief;
    goal: Goal;

    constructor(belief: Belief, parcelSpawnerTilePosition: Position) {
        this.belief = belief;
        this.goal = {valid: true, position: parcelSpawnerTilePosition, finalAction: null};
    }

    estimateValue(): number {
        return 0;
    }

    evaluateValue(): Promise<IDesireEvaluation> {
        throw new Error("VisitParcelSpawningTileDesire.evaluateValue is not implemented yet");
    }

    isValid(): boolean {
        if (!this.goal.valid) {
            return false;
        }

        if(this.belief.isInsideObservingArea(this.goal.position)) {
            this.goal = {valid: false};
            return false;
        }

        return true;
    }

}

export { VisitParcelSpawningTileDesire };