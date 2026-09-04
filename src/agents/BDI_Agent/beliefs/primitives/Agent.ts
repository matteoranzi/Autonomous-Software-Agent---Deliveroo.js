import {Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {CircularBuffer} from "@/agents/BDI_Agent/beliefs/primitives/CircularBuffer";

enum MovementDirection {
    UP = "UP",
    DOWN = "DOWN",
    LEFT = "LEFT",
    RIGHT = "RIGHT",
    NONE = "NONE"
}

class Agent {
    id: string;
    name: string;
    score: number;
    penalty: number;

    lastTimeObserved: number; // Timestamp of the last time the agent information was updated

    private readonly _historyPositions: CircularBuffer<Position>; // bounded history of latest known positions

    constructor(
        id: string,
        name: string,
        position: Position,
        score: number,
        penalty: number,
        maxHistoryPositions: number = 1
    ) {
        this.id = id;
        this.name = name;
        this.score = score;
        this.penalty = penalty;

        this._historyPositions = new CircularBuffer<Position>(maxHistoryPositions);
        this._historyPositions.push(position);

        this.lastTimeObserved = Date.now();
    }

    // The most recent position of the agent.
    get position(): Position {
        return this._historyPositions.latest!;
    }

    // Oldest -> newest.
    get historyPositions(): Position[] {
        return this._historyPositions.toArray();
    }

    addPosition(position: Position): void {
        this._historyPositions.push(position);
        this.lastTimeObserved = Date.now();
    }

    historyDirections(historyLength: number): MovementDirection[] {
        let positions = this.historyPositions;
        const directions: MovementDirection[] = [];

        let hl = historyLength;
        for (let i = positions.length - 1; i > 0 && hl > 0; i--) {
            const prev = positions[i - 1];
            const curr = positions[i];

            // Two consecutive samples can differ by more than one tile, and by both axes at
            // once, if moves happened between samples that weren't individually observed.
            // The true intermediate path isn't recoverable from endpoints alone, so this
            // records the x-component then the y-component of the delta rather than
            // collapsing (or silently dropping) it into a single cardinal direction.
            const dx = curr.x - prev.x;
            const dy = curr.y - prev.y;

            for (let step = 0; step < Math.abs(dx) && hl > 0; step++) {
                directions.push(dx > 0 ? MovementDirection.RIGHT : MovementDirection.LEFT);
                hl--;
            }
            for (let step = 0; step < Math.abs(dy) && hl > 0; step++) {
                directions.push(dy > 0 ? MovementDirection.UP : MovementDirection.DOWN);
                hl--;
            }
        }

        if (historyLength === hl) {
            return [MovementDirection.NONE];
        }
        return directions;
    }

    // Absorb a freshly sensed snapshot of this same agent in place, preserving position
    // history instead of being replaced wholesale. If the new position is farther than
    // maxJumpDistance (Manhattan) from the last known one, the trail is discontinuous -
    // unobserved moves happened in between - so the history is reset instead of splicing
    // in a jump.
    update(sensed: Agent, maxJumpDistance: number = 1): void {
        const manhattanDistance = Math.abs(this.position.x - sensed.position.x) + Math.abs(this.position.y - sensed.position.y);
        if (manhattanDistance > maxJumpDistance) {
            this._historyPositions.clear();
        }

        this.addPosition(sensed.position);
        this.score = sensed.score;
        this.penalty = sensed.penalty;
    }
}

export {Agent};