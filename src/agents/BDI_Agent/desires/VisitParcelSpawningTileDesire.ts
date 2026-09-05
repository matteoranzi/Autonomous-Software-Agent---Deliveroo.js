// DUMB EXPLORATION LOGIC FOR NOW, WILL BE REPLACED WITH A PROPER EXPLORATION LOGIC LATER

import {Goal, IDesire, IDesireEvaluation} from "@/agents/BDI_Agent/desires/IDesire";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";

class VisitParcelSpawningTileDesire implements IDesire{
    readonly name: string = "VisitParcelSpawningTileDesire";

    belief: Belief;
    goal: Goal;

    constructor(belief: Belief, parcelSpawnerTilePosition: Position) {
        this.belief = belief;
        this.goal = {valid: true, position: parcelSpawnerTilePosition};
    }

    estimateValue(): number {
        throw new Error("VisitParcelSpawningTileDesire.estimateValue is not implemented yet");
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