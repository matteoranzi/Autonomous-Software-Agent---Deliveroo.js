import {IPathFinder, PathfindingResult} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {Plan} from "@/agents/BDI_Agent/planning/Plan";
import {AStarPathFinder} from "@/agents/BDI_Agent/planning/pathfinding/AStarPathFinder";

class PredictivePlanner {
    private readonly _pathFinder: IPathFinder;
    private readonly _belief: Belief;

    constructor(belief: Belief) {
        this._pathFinder = new AStarPathFinder(belief);
        this._belief = belief;
    }

    async predictPlanCost(start: Position, desire: IDesire): Promise<number> {
        if (!desire.goal.valid) {
            return Infinity;
        }

        const result: PathfindingResult = await this._pathFinder.findPath(start, desire.goal.position);

        if (result.found) {
            return result.path.cost;
        }

        return Infinity;
    }
}

export { PredictivePlanner };