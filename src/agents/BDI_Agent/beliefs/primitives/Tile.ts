// const TileType = {
//     NON_WALKABLE: '0',
//     PARCEL_SPAWNER: '1',
//     PARCEL_DELIVERY: '2',
//     WALKABLE: '3',
//
//     // Directional tiles: cannot be entered in the opposite direction of the arrow
//     DIRECTIONAL: {
//         UP: '↑',
//         DOWN: '↓',
//         LEFT: '←',
//         RIGHT: '→',
//     },
//
//     CRATE_SLIDE: '5',
//     CRATE_SPAWNER: '5!',
// } as const;

enum TileType {
    WALL,
    PARCEL_SPAWNER,
    PARCEL_DELIVERY,
    WALKABLE,
    BASE,
    CRATE_SLIDE,
    CRATE_SPAWNER,
    DIRECTIONAL_UP,
    DIRECTIONAL_DOWN,
    DIRECTIONAL_LEFT,
    DIRECTIONAL_RIGHT,
}

enum TileDirection {
    NONE,
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

class Tile {
    private readonly _isWalkable: boolean = false;
    private readonly _isParcelDelivery: boolean = false;
    private readonly _isParcelSpawner: boolean = false;
    private readonly _isCrateAllowed: boolean = false;
    private readonly _direction: TileDirection = TileDirection.NONE;


    constructor(tileType: TileType) {
        switch (tileType) {
            case TileType.WALL:
                this._isWalkable = false;
                break;
            case TileType.PARCEL_SPAWNER:
                this._isWalkable = true;
                this._isParcelSpawner = true;
                break;
            case TileType.PARCEL_DELIVERY:
                this._isWalkable = true;
                this._isParcelDelivery = true;
                break;
            case TileType.WALKABLE:
                this._isWalkable = true;
                break;
            case TileType.CRATE_SLIDE:
                this._isWalkable = true;
                this._isCrateAllowed = true;
                break;
            case TileType.CRATE_SPAWNER:
                this._isWalkable = true;
                this._isCrateAllowed = true;
                break;
            case TileType.DIRECTIONAL_UP:
                this._isWalkable = true;
                this._direction = TileDirection.UP;
                break;
            case TileType.DIRECTIONAL_DOWN:
                this._isWalkable = true;
                this._direction = TileDirection.DOWN;
                break;
            case TileType.DIRECTIONAL_LEFT:
                this._isWalkable = true;
                this._direction = TileDirection.LEFT;
                break;
            case TileType.DIRECTIONAL_RIGHT:
                this._isWalkable = true;
                this._direction = TileDirection.RIGHT;
                break;
        }
    }

    get isParcelDelivery(): boolean {
        return this._isParcelDelivery;
    }

    get isParcelSpawner(): boolean {
        return this._isParcelSpawner;
    }

    get isCrateAllowed(): boolean {
        return this._isCrateAllowed;
    }

    get direction(): TileDirection {
        return this._direction;
    }

    get isWalkable(): boolean {
        return this._isWalkable;
    }

    toString(item: string = "  "): string {
        const reset = '\x1b[0m';

        if (this._isParcelDelivery) {
            return `\x1b[41m ${item}${reset}|`; // red bg
        }
        if (this._isParcelSpawner) {
            return `\x1b[42m ${item}${reset}|`; // green bg
        }
        if (this._isCrateAllowed) {
            return `\x1b[43m ${item}${reset}|`; // yellow bg
        }
        if (this._direction) {
            switch (this._direction) {
                case TileDirection.UP:
                    return `\x1b[44m↑${item}${reset}|`; // blue bg
                case TileDirection.DOWN:
                    return `\x1b[44m↓${item}${reset}|`; // blue bg
                case TileDirection.LEFT:
                    return `\x1b[44m←${item}${reset}|`; // blue bg
                case TileDirection.RIGHT:
                    return `\x1b[44m→${item}${reset}|`; // blue bg
            }
        }

        if (this._isWalkable) {
            return `\x1b[47m ${item}${reset}|`; // white bg
        }

        return `\x1b[40m   ${reset}|`; // black bg
    }
}

export {
    TileType,
    TileDirection,
    Tile,
}