import {Tile} from "@/agents/BDI_Agent/beliefs/primitives/Tile"
import {Parcel} from "@/agents/BDI_Agent/beliefs/primitives/Parcel"
import {Agent} from "@/agents/BDI_Agent/beliefs/primitives/Agent"
import {Crate} from "@/agents/BDI_Agent/beliefs/primitives/Crate"
import {TypedBeliefEmitter} from "@/agents/BDI_Agent/beliefs/events";
import {positionsEqual} from "@/agents/BDI_Agent/capabilities/utils";
import {
    AgentsDiff, CratesDiff,
    DeliberationContext,
    emptyAgentsDiff, emptyCratesDiff,
    emptyParcelsDiff, emptySelfAgentDiff,
    IChangeDetectionStrategy,
    ParcelsDiff, ParcelVanishReason,
    TriggeredStrategyResult,
} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {ChangeDetectionStrategyBuilder} from "@/agents/BDI_Agent/beliefs/changeDetection/ChangeDetectionStrategyBuilder";
import {ChangeDetectionRunner} from "@/agents/BDI_Agent/beliefs/changeDetection/ChangeDetectionRunner";

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
    private readonly _changeDetectionRunner: ChangeDetectionRunner;

    constructor(gameConfig: GameConfig, gameMap: GameMap, me: Agent, strategies: IChangeDetectionStrategy[] = new ChangeDetectionStrategyBuilder().withDefaults().build()) {
        this.gameConfig = gameConfig;
        this.me = me;

        this.parcels = new Map<string, Parcel>();
        this.agents = new Map<string, Agent>();
        this.crates = new Map<string, Crate>();

        this.parcelSpawnerTiles = new Array<Position>();
        this.parcelDeliveryTiles = new Array<Position>();

        this._beliefEvents = new TypedBeliefEmitter();
        this._changeDetectionRunner = new ChangeDetectionRunner(strategies);

        this._setupGameMap(gameMap);
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
                const parcelsDiff = emptyParcelsDiff();
                for (const parcel of this.parcels.values()) {
                    if (parcel.reward < 1) {
                        parcelsDiff.vanished.push({id: parcel.id, reason: ParcelVanishReason.Decayed, carriedBy: parcel.carriedBy});
                        this.parcels.delete(parcel.id);
                    } else {
                        parcel.reward--;
                    }
                }

                this._evaluateChangeStrategies({
                    belief: this,
                    parcels: parcelsDiff,
                    agents: emptyAgentsDiff(),
                    selfAgent: emptySelfAgentDiff(),
                    crates: emptyCratesDiff(),
                    facts: new Map(),
                });
            }, this.gameConfig.parcel.decay_interval);
        }

        this.observationTimer = setInterval(() => {
            this._updateLastObservedTiles();

            // Even if I do not receive any new sensing data, I update my lastTimeObserved for the dynamic beliefs that I can see.
            this._updateLastObservedDynamicBeliefs();

        }, this.gameConfig.clock);

        this._seedCratesFromMap();
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
        let previousPosition = this.me.position;
        this.me.update(me);
        let currentPosition = this.me.position;

        if (!positionsEqual(previousPosition, currentPosition)) {
            this._evaluateChangeStrategies({
                belief: this,
                parcels: emptyParcelsDiff(),
                agents: emptyAgentsDiff(),
                selfAgent: {moved: [{from: previousPosition, to: currentPosition}]},
                crates: emptyCratesDiff(),
                facts: new Map(),
            });
        }
    }

    private _updateLastObservedTiles(): void {
        this.map.grid.forEach((column, x) => {
            column.forEach((tile, y) => {
                if (this.isInsideObservingArea({x, y})) {
                    tile.lastTimeObserved = Date.now();
                }
            });
        });
    }

    private _updateLastObservedDynamicBeliefs(): void {
        this.parcels.forEach((parcel) => {
            if (this.isInsideObservingArea(parcel.position)) {
                parcel.lastTimeObserved = Date.now();
            }
        });
        this.agents.forEach((agent) => {
            if (this.isInsideObservingArea(agent.position)) {
                agent.lastTimeObserved = Date.now();
            }
        });
        this.crates.forEach((crate) => {
            if (this.isInsideObservingArea(crate.position)) {
                crate.lastTimeObserved = Date.now();
            }
        });
    }

    updateDynamicBeliefs(dynamicBelief: DynamicBelief): void {
        const parcelsDiff = this.updateParcels(dynamicBelief.parcels);
        const agentsDiff = this.updateAgents(dynamicBelief.agents);
        const cratesDiff = this.updateCrates(dynamicBelief.crates);

        this._evaluateChangeStrategies({
            belief: this,
            parcels: parcelsDiff,
            selfAgent: emptySelfAgentDiff(),
            agents: agentsDiff,
            crates: cratesDiff,
            facts: new Map(),
        });
    }

    updateAgents(sensedAgents: Agent[]): AgentsDiff {
        const diff = emptyAgentsDiff();

        for (const sensedAgent of sensedAgents) {
            const existingAgent = this.agents.get(sensedAgent.id);
            if (existingAgent) {
                const previousPosition = existingAgent.position;
                existingAgent.update(sensedAgent);
                const currentPosition = existingAgent.position;

                if (!positionsEqual(previousPosition, currentPosition)) {
                    diff.moved.push({agentId: sensedAgent.id, from: previousPosition, to: currentPosition});
                }
            } else {
                this.agents.set(sensedAgent.id, sensedAgent);
                diff.moved.push({agentId: sensedAgent.id, from: null, to: sensedAgent.position});
            }
        }

        return diff;
    }

    updateCrates(sensedCrates: Crate[]): CratesDiff {
        const diff = emptyCratesDiff();

        for (const sensedCrate of sensedCrates) {
            if (sensedCrate.id === null) {
                continue; // sensed crates always carry a real id; a null one would mean malformed sensing data
            }

            const existingCrate = this.crates.get(sensedCrate.id);
            if (existingCrate && !positionsEqual(existingCrate.position, sensedCrate.position)) {
                diff.moved.push({crateId: sensedCrate.id, from: existingCrate.position, to: sensedCrate.position});
            }

            // This step is used to confirm the existence of never observed crates that were seeded from the map's crate spawner tiles.
            // If a crate is sensed at a position where a seed was placed, the seed is removed and the sensed crate is added instead.
            this.crates.delete(this._seedCrateKey(sensedCrate.position)); // promote a matching seed instead of duplicating it
            this.crates.set(sensedCrate.id, sensedCrate);
        }

        // Unconfirmed seed guesses are the only entries ever discarded: if a seed's position is
        // currently observed and no crate showed up there, the crate already moved elsewhere
        // before we arrived and the guess is simply wrong.
        this.crates.forEach((believedCrate: Crate, key: string) => {
            if (believedCrate.id === null
                && this.isInsideObservingArea(believedCrate.position)
                && !sensedCrates.some((c) => positionsEqual(c.position, believedCrate.position)))
            {
                diff.discardedSeedPositions.push(believedCrate.position);
                this.crates.delete(key);
            }
        })

        return diff;
    }

    updateParcels(sensedParcels: Parcel[]): ParcelsDiff {
        const diff = emptyParcelsDiff();

        for (const sensedParcel of sensedParcels) {
            let parcel = this.parcels.get(sensedParcel.id);
            if (!parcel) {
                diff.newIds.push(sensedParcel.id);
            } else if (parcel.carriedBy !== sensedParcel.carriedBy) {
                diff.carriedByChanged.push({id: sensedParcel.id, from: parcel.carriedBy, to: sensedParcel.carriedBy});
            }

            this.parcels.set(sensedParcel.id, sensedParcel);
        }


        // Remove stale parcels believed to exist in the current observing area, but that are no more present.
        this.parcels.forEach((believedParcel: Parcel) => {
            if (this.isInsideObservingArea(believedParcel.position) && !sensedParcels.some((p) => p.id === believedParcel.id)) {
                diff.vanished.push({id: believedParcel.id, reason: ParcelVanishReason.Unobserved, carriedBy: believedParcel.carriedBy});
                this.parcels.delete(believedParcel.id);
            }
        })

        return diff;
    }

    // TODO create an alternative method that takes into consideration how long the tile has been:
    //  - unobserved
    //  - blocked by another agent (i.e., how long it stayed still on such position)
    //  - crowding of surroundings
    //  ---> not a boolean value but a Fuzzy Logic score
    isPositionCurrentlyWalkable(position: Position): boolean {
        // Check if the position is within the bounds of the map
        if (position.x < 0 || position.x >= this.map.width || position.y < 0 || position.y >= this.map.height) {
            return false;
        }

        // Check if the terrain itself is walkable
        if (!this.map.grid[position.x][position.y].isWalkable) {
            return false;
        }

        // Check if any other agent is currently occupying the position
        if ([...this.agents.values()].some((agent) => agent.id !== this.me.id && positionsEqual(agent.position, position))) {
            return false;
        }

        // Check if any crate is currently occupying the position
        if ([...this.crates.values()].some((crate) => positionsEqual(crate.position, position))) {
            return false;
        }

        return true;
    }

    isAgentCarryingParcels(agentId: string): boolean {
        return ([...this.parcels.values()].some((parcel) => parcel.carriedBy === agentId));
    }

    isInsideObservingArea = (position: Position): boolean => {
        return Math.abs(this.me.position.x - position.x) + Math.abs(this.me.position.y - position.y) <= this.gameConfig.agent.observation_distance
    }

    toString(showGridMap: boolean = false, showHeatMap: boolean = false): string {
        let beliefString = '*** BELIEF ***\n\n';

        beliefString += this._meToString();
        beliefString += '\n=========\n';
        beliefString += this._gameConfigToString();
        if (showGridMap) {
            beliefString += '\n=========\n';
            beliefString += this._gridToString(showHeatMap);
        }
        beliefString += '\n=========\n';
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

    private _gridToString(showHeatMap: boolean = false): string {
        const {width, height, grid} = this.map;
        const getTile = (x: number, y: number): Tile => grid[x][y];
        const rowIndices = Array.from({length: height}, (_, i) => height - 1 - i)

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

    private _evaluateChangeStrategies(context: DeliberationContext): void {
        const triggeredResults = this._changeDetectionRunner.run(context);
        if (triggeredResults.length > 0) {
            this._emitRelevantChangesForDesires(triggeredResults);
        }
    }

    onRelevantChangesForDesires(callback: (results: TriggeredStrategyResult[]) => void): void {
        this._beliefEvents.on('relevantChanges4Desires', callback);
    }

    private _emitRelevantChangesForDesires(results: TriggeredStrategyResult[]): void {
        this._beliefEvents.emit('relevantChanges4Desires', results);
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