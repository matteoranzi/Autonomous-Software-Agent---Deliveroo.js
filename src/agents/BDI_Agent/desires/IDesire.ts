import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";

type Goal = {valid: true, position: Position, finalAction: AgentActions | null}
    | {valid: false};

enum DesireCategory {
    PICKUP,
    DELIVER,
    EXPLORE,
}

interface IDesire {
    readonly name: string;
    readonly category: DesireCategory;
    goal: Goal; // Where the Agent intends to head based on the info he had when he formed this desire

    // get evaluation(): Promise<IDesireEvaluation>;
    evaluate(): Promise<IDesireEvaluation>;

    // Returns true if the desire is still valid, false if it should be discarded
    isValid(): boolean;
}

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

export {IDesire, IDesireEvaluation, Goal, PRIORITY, DesireCategory}