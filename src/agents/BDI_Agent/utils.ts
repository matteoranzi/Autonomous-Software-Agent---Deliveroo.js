import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {TileDirection} from "@/agents/BDI_Agent/beliefs/primitives/Tile";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";

/**
 * Calculates the Manhattan distance between two points.
 * @param pointA - The first point.
 * @param pointB - The second point.
 * @returns The Manhattan distance between the two points.
 */
function manhattanDistance(pointA: Position, pointB: Position): number {
    return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
}

// Shared key format for a Set<string> of occupied positions, e.g. current rival agent/crate
// tiles, so callers can precompute occupancy once and pass it into getNeighbors cheaply.
function positionKey(position: Position): string {
    return `${position.x},${position.y}`;
}

/**
 * Compares two positions by value (x and y), instead of by object reference.
 */
function positionsEqual(pointA: Position, pointB: Position): boolean {
    return pointA.x === pointB.x && pointA.y === pointB.y;
}

/**
 * Determines the cardinal direction of travel from currentTile to nextTile.
 * Returns null if the two tiles aren't exactly one cardinal step apart.
 */
function whichMoveDirection(currentTile: Position, nextTile: Position, reverse = false): AgentActions | null {
    if (reverse) {
        [currentTile, nextTile] = [nextTile, currentTile];
    }

    if (currentTile.x === nextTile.x && currentTile.y < nextTile.y) return AgentActions.MOVE_UP
    if (currentTile.x === nextTile.x && currentTile.y > nextTile.y) return AgentActions.MOVE_DOWN;
    if (currentTile.x < nextTile.x && currentTile.y === nextTile.y) return AgentActions.MOVE_RIGHT;
    if (currentTile.x > nextTile.x && currentTile.y === nextTile.y) return AgentActions.MOVE_LEFT;

    return null;
}


// TODO inject a strategy for determining which neighbors are valid, e.g., static terrain vs. dynamic occupancy
function getNeighbors(belief: Belief,
                      tile: Position,
                      tileWalkableStrategy: (position: Position) => boolean = (position) => belief.isPositionCurrentlyWalkable(position)): Position[] {
    const neighbors: Position[] = [];

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0 || Math.abs(dx) + Math.abs(dy) === 2) continue; // skip self and diagonals

            const neighborPosition: Position = {x: tile.x + dx, y: tile.y + dy};

            // Covers bounds, terrain walkability, and current occupancy by a rival agent or a crate.
            if (!tileWalkableStrategy(neighborPosition)) continue;

            const neighborTile = belief.map.grid[neighborPosition.x][neighborPosition.y];
            if (neighborTile.direction === TileDirection.UP    && dy === -1) continue; // current tile is above a one-way-up cell
            if (neighborTile.direction === TileDirection.RIGHT && dx === -1) continue; // current tile is right of a one-way-right cell
            if (neighborTile.direction === TileDirection.DOWN  && dy ===  1) continue; // current tile is below a one-way-down cell
            if (neighborTile.direction === TileDirection.LEFT  && dx ===  1) continue; // current tile is left of a one-way-left cell

            neighbors.push(neighborPosition);
        }
    }

    return neighbors;
}
export { manhattanDistance, getNeighbors, positionKey, positionsEqual, whichMoveDirection};