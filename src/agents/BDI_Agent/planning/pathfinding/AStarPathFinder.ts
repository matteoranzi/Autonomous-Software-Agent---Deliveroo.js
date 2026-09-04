import {
    IPathFinder,
    MoveDirection,
    NavigationPath,
    PathfindingResult
} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {manhattanDistance, getNeighbors, positionKey} from "@/agents/BDI_Agent/capabilities/utils";
import {MinPriorityQueue} from "@datastructures-js/priority-queue";


const COST_TO_NEIGHBOR = 1;

class AStarPathFinder implements IPathFinder {
    belief: Belief

    constructor(belief: Belief) {
        this.belief = belief;
    }

    async findPath(start: Position, goal: Position): Promise<PathfindingResult> {
        const map = this.belief.map;
        const startTile = {x: start.x, y: start.y};
        const targetTile = {x: goal.x, y: goal.y};

        // Computed once per pathfinding call, not per neighbor check: current rival agent and
        // crate positions are treated as temporarily blocked.
        //TODO: this is a frozen snapshot. implement prediction of rival agents positions
        const occupiedTiles = new Set<string>();
        this.belief.agents.forEach((agent) => {
            if (agent.id !== this.belief.me.id) {
                occupiedTiles.add(positionKey(agent.position));
            }
        });
        this.belief.crates.forEach((crate) => {
            occupiedTiles.add(positionKey(crate.position));
        });

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


            if (currentTile.x === targetTile.x && currentTile.y === targetTile.y) {
                return this.reconstructPath(cameFrom, currentTile);
            }

            for (const neighborTile of getNeighbors(map, currentTile, occupiedTiles)) {
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

    // Returns null if currentTile and nextTile aren't exactly one cardinal step apart.
    whichMoveDirection(currentTile: Position, nextTile: Position, reverse = false): MoveDirection | null {
        if (reverse) {
            [currentTile, nextTile] = [nextTile, currentTile];
        }

        if (currentTile.x === nextTile.x && currentTile.y < nextTile.y) return MoveDirection.UP
        if (currentTile.x === nextTile.x && currentTile.y > nextTile.y) return MoveDirection.DOWN;
        if (currentTile.x < nextTile.x && currentTile.y === nextTile.y) return MoveDirection.RIGHT;
        if (currentTile.x > nextTile.x && currentTile.y === nextTile.y) return MoveDirection.LEFT;

        return null;
    }

    // goalTile is the tile the search terminated on (i.e. the actual goal); cameFrom is walked
    // backward from there to the true start.
    reconstructPath(cameFrom: (Position | null)[][], goalTile: Position): PathfindingResult {
        let currentTile = goalTile;
        let navigationPath: NavigationPath = {
            start: goalTile, // will be updated to the true start after walking back
            goal: goalTile,
            cost: 0,
            path: []
        }

        while (true) {
            const predecessor = cameFrom[currentTile.x][currentTile.y];
            if (predecessor === null) break;

            const direction = this.whichMoveDirection(currentTile, predecessor, true);
            if (direction === null) {
                console.error(`reconstructPath: (${predecessor.x},${predecessor.y}) and (${currentTile.x},${currentTile.y}) are not cardinally adjacent`);
                return {found: false};
            }

            navigationPath.path.push({from: predecessor, to: currentTile, action: direction});

            currentTile = predecessor;
            navigationPath.cost++;
        }

        navigationPath.path = navigationPath.path.reverse();
        navigationPath.start = currentTile; // walked all the way back: this is the true start
        return {found: true, path: navigationPath};
    }
}

export {AStarPathFinder}