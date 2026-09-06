import {
    IPathFinder,
    NavigationPath,
    PathfindingResult
} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {manhattanDistance, getNeighbors, positionsEqual, whichMoveDirection} from "@/agents/BDI_Agent/utils";
import {MinPriorityQueue} from "@datastructures-js/priority-queue";


const COST_TO_NEIGHBOR = 1;

class AStarPathFinder implements IPathFinder {
    readonly name: string = "A*_path_finder";
    
    belief: Belief

    constructor(belief: Belief) {
        this.belief = belief;
    }

    // TODO: belief.isPositionCurrentlyWalkable reflects a frozen snapshot of agent/crate
    //  positions at call time. Implement prediction of rival agents' positions.
    async findPath(start: Position, goal: Position): Promise<PathfindingResult> {
        const map = this.belief.map;
        const startTile = {x: start.x, y: start.y};
        const targetTile = {x: goal.x, y: goal.y};

        type TileScore = {tile: Position, distance: number};
        const minQueue = new MinPriorityQueue<TileScore>((tileScore) => tileScore.distance, [{tile: startTile, distance: 0}]);
        const cameFrom: (Position | null)[][] = Array.from({length: map.width}, () => new Array(map.height).fill(null));
        const costScore: number[][] = Array.from({length: map.width}, () => new Array(map.height).fill(Infinity));
        const fScore: number[][] = Array.from({length: map.width}, () => new Array(map.height).fill(Infinity));


        costScore[startTile.x][startTile.y] = 0;
        fScore[startTile.x][startTile.y] = manhattanDistance(startTile, targetTile);
        while (!minQueue.isEmpty()) {
            // Non-null: isEmpty() was just checked false, so dequeue() is guaranteed a value here.
            const { tile: currentTile, distance: dequeuedDistance } = minQueue.dequeue()!;

            // stale entry: a better path to this tile was already processed
            if (dequeuedDistance > fScore[currentTile.x][currentTile.y]) continue;


            if (positionsEqual(currentTile, targetTile)) {
                return this.reconstructPath(cameFrom, currentTile);
            }

            for (const neighborTile of getNeighbors(this.belief, currentTile)) {
                const tentativeCostScore = costScore[currentTile.x][currentTile.y] + COST_TO_NEIGHBOR;

                if (tentativeCostScore < costScore[neighborTile.x][neighborTile.y]) {
                    cameFrom[neighborTile.x][neighborTile.y] = currentTile;
                    costScore[neighborTile.x][neighborTile.y] = tentativeCostScore;
                    fScore[neighborTile.x][neighborTile.y] = tentativeCostScore + manhattanDistance(neighborTile, targetTile);
                    minQueue.enqueue({tile: neighborTile, distance: fScore[neighborTile.x][neighborTile.y]});
                }
            }
        }

        return {found: false};
    }

    // goalTile is the tile the search terminated on (i.e. the actual goal); cameFrom is walked
    // backward from there to the true start.
    reconstructPath(cameFrom: (Position | null)[][], goalTile: Position): PathfindingResult {
        let currentTile = goalTile;
        let navigationPath: NavigationPath = {
            start: goalTile, // will be updated to the true start after walking back
            goal: goalTile,
            cost: 0,
            steps: []
        }

        while (true) {
            const predecessor = cameFrom[currentTile.x][currentTile.y];
            if (predecessor === null) break;

            const direction = whichMoveDirection(currentTile, predecessor, true);
            if (direction === null) {
                console.error(`reconstructPath: (${predecessor.x},${predecessor.y}) and (${currentTile.x},${currentTile.y}) are not cardinally adjacent`);
                return {found: false};
            }

            navigationPath.steps.push({from: predecessor, to: currentTile, action: direction});

            currentTile = predecessor;
            navigationPath.cost++;
        }

        navigationPath.steps = navigationPath.steps.reverse();
        navigationPath.start = currentTile; // walked all the way back: this is the true start
        return {found: true, path: navigationPath};
    }
}

export {AStarPathFinder}