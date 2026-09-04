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
    private readonly _isCrateSpawner: boolean = false;
    private readonly _isCrateAllowed: boolean = false;
    private readonly _direction: TileDirection = TileDirection.NONE;

    lastTimeObserved: number = 0; // Timestamp of the last time this tile was seen by the agent

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
                this._isCrateSpawner = true;
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

    get isCrateSpawner(): boolean {
        return this._isCrateSpawner;
    }

    get direction(): TileDirection {
        return this._direction;
    }

    get isWalkable(): boolean {
        return this._isWalkable;
    }

    toString(item: string = "  ", heatMap?: {r: number, g: number, b: number}): string {
        const reset = '\x1b[0m';

        if (!this.isWalkable) {
            return `\x1b[40m   ${reset}|`; // black bg
        }

        const { bg, edgeChar } = this._typeStyle();

        // Tile's own character (e.g. a directional arrow) is always shown; only the
        // background swaps from the type's default color to the heatmap color when given.
        const background = heatMap ? `\x1b[48;2;${heatMap.r};${heatMap.g};${heatMap.b}m` : `\x1b[${bg}m`;
        return `${background}${edgeChar}${item}${reset}|`;
    }

    private _typeStyle(): { bg: string; edgeChar: string } {
        if (this._isParcelDelivery) {
            return { bg: '41', edgeChar: ' ' }; // red bg
        }
        if (this._isParcelSpawner) {
            return { bg: '42', edgeChar: ' ' }; // green bg
        }
        if (this._isCrateAllowed) {
            return { bg: '43', edgeChar: ' ' }; // yellow bg
        }
        switch (this._direction) {
            case TileDirection.UP:
                return { bg: '44', edgeChar: '↑' }; // blue bg
            case TileDirection.DOWN:
                return { bg: '44', edgeChar: '↓' }; // blue bg
            case TileDirection.LEFT:
                return { bg: '44', edgeChar: '←' }; // blue bg
            case TileDirection.RIGHT:
                return { bg: '44', edgeChar: '→' }; // blue bg
        }

        return { bg: '47', edgeChar: ' ' }; // white bg (plain walkable tile; toString already excludes non-walkable)
    }
}

export {
    TileType,
    TileDirection,
    Tile,
}