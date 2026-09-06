import {IPathFinder, PathfindingResult} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";
import {AStarPathFinder} from "@/agents/BDI_Agent/planning/pathfinding/AStarPathFinder";
import {Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {Plan, ValidPlan} from "@/agents/BDI_Agent/planning/Plan";

class Planner {
    // Ordered list of pathfinding algorithms to fallback on if the previous one fails to find a path
    private _pathFinders: IPathFinder[] = [];

    //TODO: use strategy pattern to build array of pathfinders
    constructor(pathFinders: IPathFinder[]) {
        this._pathFinders = pathFinders;
    }

    async plan(start: Position, desire: IDesire): Promise<ValidPlan> {
        if (!desire.goal.valid) {
            return { valid: false };
        }

        let result: PathfindingResult;
        for (const pathFinder of this._pathFinders) {
            const result = await pathFinder.findPath(start, desire.goal.position);

            if (result.found) {
                return {
                    valid: true,
                    plan: new Plan(result.path, desire.goal.finalAction)
                };
            }
        }

        return { valid: false };
    }
}