import {IPathFinder} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";

class Pathfinder implements IPathFinder {
    readonly name: string = "PDDL_path_finder";

    findPath(start: string, goal: string): string[] {
        throw new Error ("PDDL_PathFinder is not implemented yet. Please implement the findPath method.");
    }
}