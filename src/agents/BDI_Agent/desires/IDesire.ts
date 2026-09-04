import {Position} from "@/agents/BDI_Agent/beliefs/Belief";

interface IDesire {
    readonly name: string;
    readonly goal: Position; // Where the Agent intends to head based on the info he had when he formed this desire

    // Cheap heuristic score for the coarse filter pass
    estimateValue(): number;

    // Expensive evaluation of the desire's value, after the coarse filter pass
    evaluateValue(): Promise<IDesireEvaluation>;

    // Returns true if the desire is still valid, false if it should be discarded
    isValid(): boolean;
}

// TODO determine proper desire evaluation parameters
interface IDesireEvaluation {
    utility: number;
    estimatedSteps: number;
    risk: number;
    urgency: number;
    expectedReward: number;
}

export {IDesire, IDesireEvaluation}