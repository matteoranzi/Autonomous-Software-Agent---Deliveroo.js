import {Tile} from "@/agents/BDI_Agent/beliefs/primitives/Tile"
import {Parcel} from "@/agents/BDI_Agent/beliefs/primitives/Parcel"
import {Agent} from "@/agents/BDI_Agent/beliefs/primitives/Agent"
import {Crate} from "@/agents/BDI_Agent/beliefs/primitives/Crate"
import {TypedBeliefEmitter} from "@/agents/BDI_Agent/beliefs/events";
import {positionsEqual} from "@/agents/BDI_Agent/capabilities/utils";

type GameMap = { width: number, height: number, grid: Tile[][] };
type Position = { x: number, y: number };

type DynamicBelief = { agents: Agent[]; parcels: Parcel[], crates: Crate[] };

type PlayerConfig = {
    movement_duration: number,
    observation_distance: number
    capacity: number
}

type ParcelsConfig = {
    generation_event: number,
    decay_interval: number,
    max_parcels: number,
    reward_average: number,
    reward_variance: number
}

type GameConfig = {
    map_name: string;
    clock: number;
    max_players: number;
    agent: PlayerConfig;
    parcel: ParcelsConfig;
}



class Belief {
    gameConfig: GameConfig;
    me: Agent
    map: GameMap;

    parcels: Map<string, Parcel>;
    agents: Map<string, Agent>;
    crates: Map<string, Crate>;

    // List of positions of the tiles that are parcel spawners and parcel delivery, for pathfinding purposes.
    parcelSpawnerTiles: Position[];
    parcelDeliveryTiles: Position[];

    parcelsDecayTimer: ReturnType<typeof setInterval> | null = null;
    observationTimer: ReturnType<typeof setInterval> | null = null;

    private readonly _beliefEvents: TypedBeliefEmitter;

    constructor(gameConfig: GameConfig, gameMap: GameMap, me: Agent) {
        this.gameConfig = gameConfig;
        this.me = me;

        this.parcels = new Map<string, Parcel>();
        this.agents = new Map<string, Agent>();
        this.crates = new Map<string, Crate>();

        this.parcelSpawnerTiles = new Array<Position>();
        this.parcelDeliveryTiles = new Array<Position>();

        this._beliefEvents = new TypedBeliefEmitter();

        this._setupGameMap(gameMap)
    }

    private _setupGameMap(gameMap: GameMap): void {
        this.map = gameMap;

        this.map.grid.forEach((column, x) => {
            column.forEach((tile, y) => {
                if (tile.isParcelSpawner) {
                    this.parcelSpawnerTiles.push({x, y});
                }
                if (tile.isParcelDelivery) {
                    this.parcelDeliveryTiles.push({x, y});
                }
            });
        });

        // Decay the reward of the parcels every parcelsDecayInterval ms
        if (this.gameConfig.parcel.decay_interval < Infinity) {
            this.parcelsDecayTimer = setInterval(() => {
                let importantChange = false;
                for (const parcel of this.parcels.values()) {
                    if (parcel.reward < 1) {
                        importantChange = true;
                        this.parcels.delete(parcel.id);
                    } else {
                        parcel.reward--;
                    }
                }

                if (importantChange) {
                    this._emitRelevantChanges4Desires();
                }
            }, this.gameConfig.parcel.decay_interval);
        }

        this.observationTimer = setInterval(() => {
            this._updateLastObservedTiles();

            // Even if I do not receive any new sensing data, I update my lastTimeObserved for the dynamic beliefs that I can see.
            this._updateLastObservedDynamicBeliefs();

        }, this.gameConfig.clock);

        this._seedCratesFromMap();

        this._emitRelevantChanges4Desires();
    }

    // Seed crates from the map's crate spawner tiles. These are unconfirmed guesses that will be promoted to confirmed crates once observed.
    private _seedCratesFromMap(): void {
        this.map.grid.forEach((column, x) => {
            column.forEach((tile, y) => {
                if (tile.isCrateSpawner) {
                    this.crates.set(this._seedCrateKey({x, y}), new Crate(null, {x, y}));
                }
            });
        });
    }

    private _seedCrateKey(position: Position): string {
        return `seed:${position.x},${position.y}`;
    }

    updateMe(me: Agent): void {
        this.me.update(me);
    }

    private _updateLastObservedTiles(): void {
        this.map.grid.forEach((column, x) => {
            column.forEach((tile, y) => {
                if (this._isInsideObservingArea({x, y})) {
                    tile.lastTimeObserved = Date.now();
                }
            });
        });
    }

    private _updateLastObservedDynamicBeliefs(): void {
        this.parcels.forEach((parcel) => {
            if (this._isInsideObservingArea(parcel.position)) {
                parcel.lastTimeObserved = Date.now();
            }
        });
        this.agents.forEach((agent) => {
            if (this._isInsideObservingArea(agent.position)) {
                agent.lastTimeObserved = Date.now();
            }
        });
        this.crates.forEach((crate) => {
            if (this._isInsideObservingArea(crate.position)) {
                crate.lastTimeObserved = Date.now();
            }
        });
    }

    updateBeliefs(dynamicBelief: DynamicBelief): void {
        if (this.updateParcels(dynamicBelief.parcels)) {
            this._emitRelevantChanges4Desires();
        }

        this.updateAgents(dynamicBelief.agents);
        this.updateCrates(dynamicBelief.crates);
    }

    updateAgents(sensedAgents: Agent[]): void {
        for (const sensedAgent of sensedAgents) {
            const existingAgent = this.agents.get(sensedAgent.id);
            if (existingAgent) {
                existingAgent.update(sensedAgent);
            } else {
                this.agents.set(sensedAgent.id, sensedAgent);
            }
        }
    }

    updateCrates(sensedCrates: Crate[]): void {
        // Crates are never deleted, only moved: a confirmed crate always gets refreshed in
        // place (by real id) here, never removed for going unseen.
        for (const sensedCrate of sensedCrates) {
            if (sensedCrate.id === null) {
                continue; // sensed crates always carry a real id; a null one would mean malformed sensing data
            }
            this.crates.delete(this._seedCrateKey(sensedCrate.position)); // promote a matching seed instead of duplicating it
            this.crates.set(sensedCrate.id, sensedCrate);
        }

        // Unconfirmed seed guesses are the only entries ever discarded: if a seed's position is
        // currently observed and no crate showed up there, the crate already moved elsewhere
        // before we arrived and the guess is simply wrong.
        this.crates.forEach((believedCrate: Crate, key: string) => {
            if (believedCrate.id === null
                && this._isInsideObservingArea(believedCrate.position)
                && !sensedCrates.some((c) => positionsEqual(c.position, believedCrate.position))) {
                this.crates.delete(key);
            }
        })
    }

    updateParcels(sensedParcels: Parcel[]): boolean {
        // Major changes to notify:
        // - A new parcel appears (not in the belief yet)
        // - A believed parcel disappears from the observed area
        // - A parcel is taken by another agent (carriedBy changes from null to an agent id)
        // - A parcel is dropped by another agent (carriedBy changes from an agent id to null)
        let changed = false;

        for (const sensedParcel of sensedParcels) {
            let parcel = this.parcels.get(sensedParcel.id);
            if (!parcel || parcel.carriedBy !== sensedParcel.carriedBy) {
                changed = true;
            }

            this.parcels.set(sensedParcel.id, sensedParcel);
        }


        // Remove stale parcels believed to exist in the current observing area, but that are no more present.
        this.parcels.forEach((believedParcel: Parcel) => {
            if (this._isInsideObservingArea(believedParcel.position) && !sensedParcels.some((p) => p.id === believedParcel.id)) {
                changed = true;
                this.parcels.delete(believedParcel.id);
            }
        })

        return changed;
    }

    isPositionCurrentlyWalkable(position: Position): boolean {
        // A tile is blocked if it is outside the map, if the terrain itself isn't walkable,
        // or if it is currently occupied by a crate or another agent.
        if (position.x < 0 || position.x >= this.map.width || position.y < 0 || position.y >= this.map.height) {
            return false;
        }

        if (!this.map.grid[position.x][position.y].isWalkable) {
            return false;
        }

        if ([...this.agents.values()].some((agent) => agent.id !== this.me.id && positionsEqual(agent.position, position))) {
            return false;
        }

        if ([...this.crates.values()].some((crate) => positionsEqual(crate.position, position))) {
            return false;
        }

        return true;
    }

    private _isInsideObservingArea = (position: Position): boolean => {
        return Math.abs(this.me.position.x - position.x) + Math.abs(this.me.position.y - position.y) <= this.gameConfig.agent.observation_distance
    }

    toString(rotateGridView: boolean = true, showHeatMap: boolean = false): string {
        let beliefString = '*** BELIEF ***\n\n';

        beliefString += this._meToString();
        beliefString += '\n=========\n';
        // beliefString += this._gameConfigToString();
        // beliefString += '\n=========\n';
        // beliefString += this._gridToString(rotateGridView, showHeatMap);
        // beliefString += '\n=========\n';
        beliefString += this._parcelsToString();
        beliefString += '\n=========\n';
        beliefString += this._agentsToString()

        return beliefString;
    }

    private _meToString(): string {
        return `Me: Agent ${this.me.id}: Position (${this.me.position.x}, ${this.me.position.y}), Score: ${this.me.score}, Penalty: ${this.me.penalty}\n`;
    }

    private _gameConfigToString(): string {
        const {map_name, clock, max_players, agent, parcel} = this.gameConfig;

        let configString = 'Game Config:\n';
        configString += `  - Map: ${map_name}, Clock: ${clock}ms, Max players: ${max_players}\n`;
        configString += `  - Player: Movement duration: ${agent.movement_duration}ms, Observation distance: ${agent.observation_distance}, Capacity: ${agent.capacity}\n`;
        configString += `  - Parcels: Generation event: ${parcel.generation_event}ms, Decay interval: ${parcel.decay_interval}ms, Max parcels: ${parcel.max_parcels}, Reward avg: ${parcel.reward_average}, Reward variance: ${parcel.reward_variance}\n`;

        return configString;
    }

    private _parcelsToString(): string {
        let parcelsString = 'Parcels:\n';
        let now = Date.now();
        const sortedParcels = [...this.parcels.values()].sort((a, b) => b.reward - a.reward);
        for (const parcel of sortedParcels) {
            let timeSinceUpdate = ((now - parcel.lastTimeObserved) / 1000).toFixed(2);
            parcelsString += `  - Parcel ${parcel.id}: Position (${parcel.position.x}, ${parcel.position.y}), Carried by: ${parcel.carriedBy}, Reward: ${parcel.reward}, Time since update: ${timeSinceUpdate}s\n`;
        }

        return parcelsString;
    }

    private _agentsToString(): string {
        let agentsString = 'Agents:\n';
        let now = Date.now();
        const sortedAgents = [...this.agents.values()].sort((a, b) => b.lastTimeObserved - a.lastTimeObserved);
        for (const agent of sortedAgents) {
            let timeSinceUpdate = ((now - agent.lastTimeObserved) / 1000).toFixed(2);
            let directions = agent.historyDirections(3).map((dir) => dir.toString()).join(' <- ');
            agentsString += `  - Agent ${agent.id}, pos (${agent.position.x}, ${agent.position.y}), dirs: ${directions}, score: ${agent.score}, last update: ${timeSinceUpdate}s\n`;
        }

        return agentsString;
    }

    private _gridToString(rotateGridView: boolean = true, showHeatMap: boolean = false): string {
        const {width, height, grid} = this.map;
        const getTile = (x: number, y: number): Tile => rotateGridView ? grid[x][y] : grid[y][x];
        const rowIndices = rotateGridView
            ? Array.from({length: height}, (_, i) => height - 1 - i)
            : Array.from({length: height}, (_, i) => i);

        // Total reward of parcels at each position, indexed as "x,y" (for visualization purposes)
        const rewardByPosition = new Map<string, number>();
        this.parcels.forEach((parcel) => {
            const key = `${parcel.position.x},${parcel.position.y}`;
            rewardByPosition.set(key, (rewardByPosition.get(key) ?? 0) + parcel.reward);
        });

        let gridString = 'Grid:\n';
        for (const y of rowIndices) {
            gridString += `${y.toString().padStart(2, '0')} `;
            for (let x = 0; x < width; x++) {
                const parcelHere = rewardByPosition.get(`${x},${y}`) ?? 0;
                let tileInfo = parcelHere ? `${parcelHere}`.padStart(2, ' ') : '  ';

                if (positionsEqual(this.me.position, {x, y})) {
                    tileInfo = "🏎"; // Highlight the agent's position
                }

                this.agents.forEach((agent) => {
                    if (positionsEqual(agent.position, {x, y})) {
                        tileInfo = "🐌"; // Highlight other agents' positions
                    }
                })

                this.crates.forEach((crate) => {
                    if (positionsEqual(crate.position, {x, y})) {
                        if (crate.id === null) {
                            tileInfo = "⚙️"; // Highlight unconfirmed crates' positions
                        } else {
                            tileInfo = "📦"; // Highlight confirmed crates' positions
                        }
                    }
                });

                const tile = getTile(x, y);
                if (showHeatMap) {
                    gridString += tile.toString(tileInfo, this._observedHeatColor(tile.lastTimeObserved));
                } else {
                    gridString += tile.toString(tileInfo);
                }
            }
            gridString += '\n';
        }

        gridString += `${''.padStart(2, '  ')} `;
        for (let x = 0; x < width; x++) {
            gridString += ` ${x.toString().padStart(2, '0')} `;
        }
        return gridString;
    }

    private _observedHeatColor(lastTimeObserved: number): { r: number, g: number, b: number } {
        // Cold (never/long unobserved) -> hot (just observed) gradient endpoints
        const HEAT_HALF_LIFE_MS = this.gameConfig.clock * 30;
        const HEAT_COLD = {r: 20, g: 20, b: 60};
        const HEAT_HOT = {r: 255, g: 60, b: 60};

        const age = Date.now() - lastTimeObserved;
        const t = Math.pow(0.5, age / HEAT_HALF_LIFE_MS);

        const r = Math.round(HEAT_COLD.r + (HEAT_HOT.r - HEAT_COLD.r) * t);
        const g = Math.round(HEAT_COLD.g + (HEAT_HOT.g - HEAT_COLD.g) * t);
        const b = Math.round(HEAT_COLD.b + (HEAT_HOT.b - HEAT_COLD.b) * t);

        return {r, g, b};
    }

    // ============================================================================================
    // Belief events
    // ============================================================================================
    private _emitRelevantChanges4Desires(): void {
        this._beliefEvents.emit('relevantChanges4Desires');
    }

    // Fires whenever a belief change could affect the current set of desires (e.g. a parcel
    // appearing or disappearing), so listeners know to regenerate their desire list.
    onRelevantChangesForDesires(callback: () => void): void {
        this._beliefEvents.on('relevantChanges4Desires', callback);
    }
}

export {
    Belief,
    GameMap,
    Position,
    DynamicBelief,

    GameConfig,
    PlayerConfig,
    ParcelsConfig,
};