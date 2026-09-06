import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {positionsEqual, getNeighbors} from "@/agents/BDI_Agent/utils";
import {PddlProblem, Beliefset} from "@matteoranzi/pddl-client";

function tileName(position: Position): string {
    return `tile_${position.x}_${position.y}`;
}

// belief.crates' Map keys are either a real server id or `seed:<x>,<y>` for an unconfirmed
// map-seeded guess - neither is guaranteed to be a valid PDDL object name.
function crateName(beliefCrateKey: string): string {
    return `crate_${beliefCrateKey.replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

function isRivalAt(belief: Belief, position: Position): boolean {
    return [...belief.agents.values()].some((agent) => positionsEqual(agent.position, position));
}

function isCrateAt(belief: Belief, position: Position): boolean {
    return [...belief.crates.values()].some((crate) => positionsEqual(crate.position, position));
}

// Controls whether currently-sensed rival agents further restrict the generated map, independent
// of crates/self (which are always fully modeled regardless of mode).
type MapOccupancyMode = {
    readonly name: string;
    getNeighborTiles(belief: Belief, tile: Position): Position[];
    isBlockedByRival(belief: Belief, tile: Position): boolean;
};

const CLEAN_MAP_MODE: MapOccupancyMode = {
    name: "clean",
    getNeighborTiles: (belief, tile) => getNeighbors(belief, tile, (pos) => belief.isPositionStaticallyWalkable(pos)),
    isBlockedByRival: () => false,
};

const FROZEN_SNAPSHOT_MODE: MapOccupancyMode = {
    name: "frozen-snapshot",
    getNeighborTiles: (belief, tile) => getNeighbors(belief, tile, (pos) => belief.isPositionStaticallyWalkable(pos) && !isRivalAt(belief, pos)),
    isBlockedByRival: isRivalAt,
};

function generatePddlProblem(belief: Belief, start: Position, goal: Position, mode: MapOccupancyMode = CLEAN_MAP_MODE): PddlProblem {
    const walkableTiles: Position[] = [];
    for (let x = 0; x < belief.map.width; x++) {
        for (let y = 0; y < belief.map.height; y++) {
            if (belief.map.grid[x][y].isWalkable) {
                walkableTiles.push({x, y});
            }
        }
    }

    const objects: string[] = ["player - sokoban"];
    for (const tile of walkableTiles) {
        objects.push(`${tileName(tile)} - tile`);
    }
    for (const key of belief.crates.keys()) {
        objects.push(`${crateName(key)} - crate`);
    }

    const beliefset = new Beliefset();

    beliefset.declare(`on player ${tileName(start)}`);
    for (const [key, crate] of belief.crates.entries()) {
        beliefset.declare(`on ${crateName(key)} ${tileName(crate.position)}`);
    }

    for (const tile of walkableTiles) {
        if (belief.map.grid[tile.x][tile.y].isCrateAllowed) {
            beliefset.declare(`crates-allowed-tile ${tileName(tile)}`);
        }
    }

    for (const tile of walkableTiles) {
        const blocked = positionsEqual(tile, start) || isCrateAt(belief, tile) || mode.isBlockedByRival(belief, tile);
        if (!blocked) {
            beliefset.declare(`free-tile ${tileName(tile)}`);
        }
    }

    for (const tile of walkableTiles) {
        for (const neighbor of mode.getNeighborTiles(belief, tile)) {
            const dx = neighbor.x - tile.x;
            const dy = neighbor.y - tile.y;
            const direction = dy === 1 ? "up" : dy === -1 ? "down" : dx === 1 ? "right" : "left";
            beliefset.declare(`adjacent-${direction} ${tileName(tile)} ${tileName(neighbor)}`);
        }
    }

    return new PddlProblem("deliveroo-pathfinding", objects.join(" "), beliefset.toPddlString(), `on player ${tileName(goal)}`);
}

export {generatePddlProblem, tileName, CLEAN_MAP_MODE, FROZEN_SNAPSHOT_MODE};
export type {MapOccupancyMode};