import type {IOTile} from "@matteoranzi/deliveroo-js-sdk";
import { TileType, Tile } from "@/agents/BDI_Agent/beliefs/primitives/Tile";
import { GameMap } from "@/agents/BDI_Agent/beliefs/Belief";
import {IOTileType} from "@matteoranzi/deliveroo-js-sdk/types/IOTile";

const IO_TILE_TYPE_ADAPTER: Record<IOTileType, TileType> = {
    '0': TileType.WALL,
    '1': TileType.PARCEL_SPAWNER,
    '2': TileType.PARCEL_DELIVERY,
    '3': TileType.WALKABLE,
    '4': TileType.BASE,
    '5': TileType.CRATE_SLIDE,
    '5!': TileType.CRATE_SPAWNER,
    '↑': TileType.DIRECTIONAL_UP,
    '↓': TileType.DIRECTIONAL_DOWN,
    '←': TileType.DIRECTIONAL_LEFT,
    '→': TileType.DIRECTIONAL_RIGHT,
};

function adaptTileType(type: IOTileType): TileType {
    return IO_TILE_TYPE_ADAPTER[type];
}
export function adaptMapPayload(_width: number, _height: number, _tiles: IOTile[]): GameMap {
    const lastTile = _tiles.at(-1);
    if (!lastTile) {
        throw new Error('adaptMapPayload: received an empty tile list');
    }

    // Compute the real map size (due to a server's bug, the received _width and _height may be wrong)
    const width: number = lastTile.x + 1
    const height: number = lastTile.y + 1

    const grid: Tile[][] = Array.from({ length: height }, () => Array(width).fill(null));
    _tiles.forEach((tile) => {
        grid[tile.x][tile.y] = new Tile(adaptTileType(tile.type));
    });

    return { width, height, grid };
}