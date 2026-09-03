import {Position} from "@/agents/BDI_Agent/beliefs/Belief";

//TODO add more complex logic
class Agent {
    id: string;
    name: string;
    position: Position; // latest known position of the agent
    score: number;
    penalty: number;

    lastUpdated: number; // Timestamp of the last time the agent information was updated

    constructor(
        id: string,
        name: string,
        position: Position,
        score: number,
        penalty: number
    ) {
        this.id = id;
        this.name = name;
        this.position = position;
        this.score = score;
        this.penalty = penalty;

        this.lastUpdated = Date.now();
    }
}

export { Agent };