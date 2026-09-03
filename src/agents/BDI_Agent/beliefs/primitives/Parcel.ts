import {Position} from "@/agents/BDI_Agent/beliefs/Belief";

class Parcel {
    id: string;
    position: Position;
    reward: number;
    carriedBy: string | null; // The ID of the agent that is carrying the parcel, or null if not carried
    
    lastUpdated: number; // Timestamp of the last time the parcel information was updated

    constructor(
        id: string,
        position: Position,
        carriedBy: string | null,
        reward: number,
    ) {
        this.id = id;
        this.position = position;
        this.carriedBy = carriedBy;
        this.reward = reward;

        this.lastUpdated = Date.now();
    }
}
export { Parcel };