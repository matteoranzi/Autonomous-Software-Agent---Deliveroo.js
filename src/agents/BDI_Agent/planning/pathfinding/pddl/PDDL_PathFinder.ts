import {IPathFinder, PathfindingResult} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";
import {Position} from "@/agents/BDI_Agent/beliefs/Belief";

class PDDL_PathFinder implements IPathFinder {
    readonly name: string = "PDDL_path_finder";

    async findPath(start: Position, goal: Position): Promise<PathfindingResult> {
        throw new Error ("PDDL_PathFinder is not implemented yet. Please implement the findPath method.");
    }
}

export { PDDL_PathFinder };