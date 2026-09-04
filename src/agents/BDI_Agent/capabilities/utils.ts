import {GameMap, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {TileDirection} from "@/agents/BDI_Agent/beliefs/primitives/Tile";

/**
 * Calculates the Manhattan distance between two points.
 * @param pointA - The first point.
 * @param pointB - The second point.
 * @returns The Manhattan distance between the two points.
 */
function manhattanDistance(pointA: { x: number; y: number }, pointB: { x: number; y: number }): number {
    return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
}

// Shared key format for a Set<string> of occupied positions, e.g. current rival agent/crate
// tiles, so callers can precompute occupancy once and pass it into getNeighbors cheaply.
function positionKey(position: Position): string {
    return `${position.x},${position.y}`;
}

function getNeighbors(map: GameMap, tile: Position, occupiedTiles: Set<string> = new Set()): Position[] {
    const neighbors: Position[] = [];

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0 || Math.abs(dx) + Math.abs(dy) === 2) continue; // skip self and diagonals

            const neighborX = tile.x + dx;
            const neighborY = tile.y + dy;

            if (neighborX < 0 || neighborX >= map.width || neighborY < 0 || neighborY >= map.height) continue;

            const neighborTile = map.grid[neighborX][neighborY];

            if (!neighborTile.isWalkable) continue;
            if (neighborTile.direction === TileDirection.UP    && dy === -1) continue; // current tile is above a one-way-up cell
            if (neighborTile.direction === TileDirection.RIGHT && dx === -1) continue; // current tile is right of a one-way-right cell
            if (neighborTile.direction === TileDirection.DOWN  && dy ===  1) continue; // current tile is below a one-way-down cell
            if (neighborTile.direction === TileDirection.LEFT  && dx ===  1) continue; // current tile is left of a one-way-left cell

            if (occupiedTiles.has(positionKey({x: neighborX, y: neighborY}))) continue; // currently blocked by a rival agent or a crate

            neighbors.push({x: neighborX, y: neighborY});
        }
    }

    return neighbors;
}
export { manhattanDistance, getNeighbors, positionKey};