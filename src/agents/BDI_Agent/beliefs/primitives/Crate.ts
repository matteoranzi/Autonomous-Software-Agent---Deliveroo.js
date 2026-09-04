import {Position} from "@/agents/BDI_Agent/beliefs/Belief";

class Crate {
    id: string | null; // real server id once confirmed by sensing; null for a map-derived guess not yet confirmed
    position: Position;

    lastTimeObserved: number; // Timestamp of the last time the agent information was updated


    constructor(id: string | null, position: Position) {
        this.id = id;
        this.position = position;

        this.lastTimeObserved = Date.now();
    }
}

export { Crate };