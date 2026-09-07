import {IPathFinder, PathfindingResult} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {AStarPathFinder} from "@/agents/BDI_Agent/planning/pathfinding/AStarPathFinder";
import {positionKey} from "@/agents/BDI_Agent/utils";

class CostEstimator {
    private readonly _pathFinder: IPathFinder;
    private readonly _belief: Belief;
    private readonly _cache = new Map<string, number>(); // key: "x,y->x,y"

    constructor(belief: Belief) {
        this._pathFinder = new AStarPathFinder(belief);
        this._belief = belief;
    }

    async estimateCost(start: Position, goal: Position): Promise<number> {
        const key = `${positionKey(start)}->${positionKey(goal)}`;
        const cached = this._cache.get(key);
        if (cached !== undefined) {
            return cached;
        }

        const result: PathfindingResult = await this._pathFinder.findPath(start, goal);
        const cost = result.found ? result.path.cost : Infinity;
        this._cache.set(key, cost);
        return cost;
    }
}

export { CostEstimator };