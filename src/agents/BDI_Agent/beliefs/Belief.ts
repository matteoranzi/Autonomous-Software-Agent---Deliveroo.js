import {Tile} from "@/agents/BDI_Agent/beliefs/primitives/Tile"
import {Parcel} from "@/agents/BDI_Agent/beliefs/primitives/Parcel"
import {Agent} from "@/agents/BDI_Agent/beliefs/primitives/Agent"

type GameMap = { width: number, height: number, grid: Tile[][] };
type Position = { x: number, y: number };

type DynamicBelief = { agents: Agent[]; parcels: Parcel[] };

// export type Crate = { id: string, x: number, y: number};


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

    map: GameMap;
    // crates: Crate[] = [];
    parcels: Map<string, Parcel>;
    agents: Map<string, Agent>;

    parcelsDecayTimer: ReturnType<typeof setInterval> | null = null;

    constructor(gameConfig: GameConfig) {
        this.gameConfig = gameConfig;

        this.parcels = new Map<string, Parcel>();
        this.agents = new Map<string, Agent>();
    }

    setGameMap(gameMap: GameMap): void {
        this.map = gameMap;

        // Decay the reward of the parcels every parcelsDecayInterval ms
        if (this.gameConfig.parcel.decay_interval < Infinity) {
            this.parcelsDecayTimer = setInterval(() => {
                for (const parcel of this.parcels.values()) {
                    if (parcel.reward < 1) {
                        this.parcels.delete(parcel.id);
                    } else {
                        parcel.reward--;
                    }
                }
            }, this.gameConfig.parcel.decay_interval);
        }
    }

    updateBeliefs(dynamicBelief: DynamicBelief): void {
        this.updateParcels(dynamicBelief.parcels)
        this.updateAgents(dynamicBelief.agents)
    }

    updateAgents(sensedAgents: Agent[]): void {
        for (const sensedAgent of sensedAgents) {
            this.agents.set(sensedAgent.id, sensedAgent);
        }
    }

    updateParcels(sensedParcels: Parcel[]): void {
        // TODO: Update parcel information of the belief based on newParcels
        //  - If we believe a parcel exists but is not in the current sensing area, delete it.

        // TODO: consider the parcels information that are shared with other agents

        for (const sensedParcel of sensedParcels) {
            this.parcels.set(sensedParcel.id, sensedParcel);
        }
    }
    
    toString(rotateGridView: boolean = true): string {
        let beliefString = '*** BELIEF ***\n\n';

        beliefString += this._gameConfigToString();
        beliefString += '\n=========\n';
        beliefString += this._gridToString(rotateGridView);
        beliefString += '\n=========\n';
        beliefString += this._parcelsToString();
        beliefString += '\n=========\n';
        beliefString += this._agentsToString()

        return beliefString;
    }

    private _gameConfigToString(): string {
        const { map_name, clock, max_players, agent, parcel } = this.gameConfig;

        let configString = 'Game Config:\n';
        configString += `  - Map: ${map_name}, Clock: ${clock}ms, Max players: ${max_players}\n`;
        configString += `  - Player: Movement duration: ${agent.movement_duration}ms, Observation distance: ${agent.observation_distance}, Capacity: ${agent.capacity}\n`;
        configString += `  - Parcels: Generation event: ${parcel.generation_event}ms, Decay interval: ${parcel.decay_interval}ms, Max parcels: ${parcel.max_parcels}, Reward avg: ${parcel.reward_average}, Reward variance: ${parcel.reward_variance}\n`;

        return configString;
    }

    private _parcelsToString(): string {
        let parcelsString = 'Parcels:\n';
        let now = Date.now();
        const sortedParcels = [...this.parcels.values()].sort((a, b) => b.lastUpdated - a.lastUpdated);
        for (const parcel of sortedParcels) {
            let timeSinceUpdate = ((now - parcel.lastUpdated) / 1000).toFixed(2);
            parcelsString += `  - Parcel ${parcel.id}: Position (${parcel.position.x}, ${parcel.position.y}), Carried by: ${parcel.carriedBy}, Reward: ${parcel.reward}, Time since update: ${timeSinceUpdate}s\n`;
        }

        return parcelsString;
    }

    private _agentsToString(): string {
        let agentsString = 'Agents:\n';
        let now = Date.now();
        const sortedAgents = [...this.agents.values()].sort((a, b) => b.lastUpdated - a.lastUpdated);
        for (const agent of sortedAgents) {
            let timeSinceUpdate = ((now - agent.lastUpdated) / 1000).toFixed(2);
            agentsString += `  - Agent ${agent.id}: Position (${agent.position.x}, ${agent.position.y}), Score: ${agent.score}, Penalty: ${agent.penalty}, Time since update: ${timeSinceUpdate}s\n`;
        }

        return agentsString;
    }

    private _gridToString(rotateGridView: boolean = true): string {
        const { width, height, grid } = this.map;
        const getTile = (x: number, y: number): Tile => rotateGridView ? grid[x][y] : grid[y][x];
        const rowIndices = rotateGridView
            ? Array.from({ length: height }, (_, i) => height - 1 - i)
            : Array.from({ length: height }, (_, i) => i);

        let gridString = 'Grid:\n';
        for (const y of rowIndices) {
            gridString += `${y.toString().padStart(2, '0')} `;
            for (let x = 0; x < width; x++) {
                let tileInfo = '  ';

                // Check if there are parcels at the current tile and get their total reward (for visualization purposes)
                const parcelHere = [...this.parcels.values()].map((parcel) => parcel.position.x === x && parcel.position.y === y ? parcel.reward : 0).reduce((sum, reward) => sum + reward, 0);
                tileInfo = parcelHere ? `${parcelHere}`.padStart(2, ' ') : '  ';

                gridString += getTile(x, y).toString(tileInfo);
            }
            gridString += '\n';
        }

        gridString += `${''.padStart(2, '  ')} `;
        for (let x = 0; x < width; x++) {
            gridString += ` ${x.toString().padStart(2, '0')} `;
        }
        return gridString;
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