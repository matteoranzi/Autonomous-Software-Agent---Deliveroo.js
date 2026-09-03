import {TILE_TYPES} from "#types/world.js";

/**
 * @typedef {import("#types/world.js").WorldMap} WorldMap
 * @typedef {import("#types/world.js").TilePosition} TilePosition
 */

/**
 * Returns the walkable neighbors of a tile, respecting walls, directional tiles, and crate-spawning tiles.
 * @param {WorldMap} map
 * @param {TilePosition} tile
 * @param {IOAgent[]} sensedAgents
 * @param {boolean} crateSpawningFriend whether the crate spawning tiles should be considered as valid neighbors (true) or not (false, default) for pathfinding purposes.
 * @returns {TilePosition[]}
 */
//TODO implement fuzzy logic with known crates positions (agent runtime memory)
export function getNeighbors(map, tile, sensedAgents = null, crateSpawningFriend = false) {
    const neighbors = [];

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0 || Math.abs(dx) + Math.abs(dy) === 2) continue; // skip self and diagonals

            const neighborX = tile.x + dx;
            const neighborY = tile.y + dy;

            if (neighborX < 0 || neighborX >= map.width || neighborY < 0 || neighborY >= map.height) continue;

            const neighborTileType = map.tiles[neighborX][neighborY];

            if (neighborTileType === TILE_TYPES.wall) continue;
            if (neighborTileType === TILE_TYPES.directional.up    && dy === -1) continue; // current tile is above a one-way-up cell
            if (neighborTileType === TILE_TYPES.directional.right && dx === -1) continue; // current tile is right of a one-way-right cell
            if (neighborTileType === TILE_TYPES.directional.down  && dy ===  1) continue; // current tile is below a one-way-down cell
            if (neighborTileType === TILE_TYPES.directional.left  && dx ===  1) continue; // current tile is left of a one-way-left cell

            //FIXME implement complete logic considering crate sliding and crate spawning cells (saved in agent memory)
            // eventually implementing a logic to determine the movement to perform to remove a crate from a sliding tile if it's blocking the path
            // if the agent discovers a blocked path once updated sensing, it should run the pathfinder again
            if (!crateSpawningFriend && neighborTileType === TILE_TYPES.crateSpawning) continue;

            //FIXME implement fuzzy logic when a tile is occupied by another agent (agent sensing + memory)

            if(sensedAgents && !freeTile(neighborX, neighborY, sensedAgents)) {
                console.log(`Tile (${neighborX}, ${neighborY}) is occupied by another agent, skipping it as a neighbor.`);
                continue;
            }

            neighbors.push({x: neighborX, y: neighborY});
        }
    }

    return neighbors;
}

function freeTile(x, y, sensing) {
    console.log(`freeTile (${x}, ${y}, ${sensing})`);
    return !sensing.some(agent => agent.x === x && agent.y === y);
}