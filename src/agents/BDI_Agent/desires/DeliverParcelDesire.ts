import {Goal, IDesire, IDesireEvaluation} from "./IDesire";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";

class DeliverParcelDesire implements IDesire {
    readonly name: string = "DeliverParcelDesire";

    belief: Belief;
    goal: Goal;

    constructor(belief: Belief, deliveryTilePosition: Position) {
        this.belief = belief;
        this.goal = {valid: true, position: deliveryTilePosition, finalAction: AgentActions.DROP};
    }

    estimateValue(): number {
        return 2;
    }

    evaluateValue(): Promise<IDesireEvaluation> {
        throw new Error("DeliverParcelDesire.evaluateValue is not implemented yet");
    }

    isValid(): boolean {
        if (!this.goal.valid) {
            return false;
        }

        // FIXME: what if the position in only momentarily unwalkable? we shouldn't immediately discard the desire,
        //  but rather wait for a few ticks to see if it becomes walkable again.
        //  This is especially important in a multi-agent environment where other agents may temporarily block the path.

        // TODO also consider stale information in the belief (maybe an agent is no longer in the position it was last seen in, but we haven't sensed it yet)
        if (this.belief.isAgentCarryingParcels(this.belief.me.id)
            && this.belief.isPositionCurrentlyWalkable(this.goal.position)) {
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

export { DeliverParcelDesire };