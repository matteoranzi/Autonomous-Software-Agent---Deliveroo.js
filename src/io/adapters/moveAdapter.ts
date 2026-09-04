import {MoveDirection} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";

function adaptMovePayload(move: MoveDirection): string {
    switch (move) {
        case MoveDirection.UP:
            return "up";
        case MoveDirection.DOWN:
            return "down";
        case MoveDirection.LEFT:
            return "left";
        case MoveDirection.RIGHT:
            return "right";
        default:
            throw new Error(`Unknown move direction: ${move}`);
    }
}