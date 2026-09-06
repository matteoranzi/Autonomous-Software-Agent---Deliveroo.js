import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";

type Goal = {valid: true, position: Position, finalAction: AgentActions | null}
    | {valid: false};

interface IDesire {
    readonly name: string;
    goal: Goal; // Where the Agent intends to head based on the info he had when he formed this desire

    evaluation(): Promise<IDesireEvaluation>;

    // Returns true if the desire is still valid, false if it should be discarded
    isValid(): boolean;
}

// TODO determine proper desire evaluation parameters
//  e.g., "A rival is likely to beat me to this parcel" is precisely what risk is for
interface IDesireEvaluation {
    utility: number;
    estimatedCost: number;
    risk: number;
    urgency: PRIORITY;
    expectedReward: number;
    category: string;
}

enum PRIORITY {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3
}

export {IDesire, IDesireEvaluation, Goal, PRIORITY }