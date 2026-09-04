import {DjsClientSocket} from "@matteoranzi/deliveroo-js-sdk/client";
import {Belief, GameMap, GameConfig} from "@/agents/BDI_Agent/beliefs/Belief"
import {adaptMapPayload} from "@/io/adapters/mapAdapter";
import {adaptSelfSensingPayload, adaptSensingPayload} from "@/io/adapters/sensingAdapter";
import {adaptConfigPayload} from "@/io/adapters/configAdapter";
import {Agent} from "@/agents/BDI_Agent/beliefs/primitives/Agent";
import {AppConfig} from "@/config";
import {DesiresGenerator} from "@/agents/BDI_Agent/desires/DesiresGenerator";
import {IPathFinder} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";
import {AStarPathFinder} from "@/agents/BDI_Agent/planning/pathfinding/AStarPathFinder";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";

// TODO: exploration strategy: find a tile that maximizes the number of unknown tiles in the sensing radius, and move towards it. If there are multiple such tiles, choose the closest one. If there are no such tiles, choose a random tile that is not a wall and is not occupied by another agent.
//  such exploration strategy in some scenarios should be preferred over pickup (e.g. in an area where there are directional tiles and so the agent will "look-ahead" and see if in other areas is there anything interesting)
class BDI_Agent {
    private readonly _djsClient: DjsClientSocket;
    private readonly _appConfig: AppConfig;

    private belief: Belief;
    private readonly _ready: Promise<void>;

    private desiresGenerator: DesiresGenerator;

    private pathFinder: IPathFinder

    constructor(djsClient: DjsClientSocket, appConfig: AppConfig) {
        this._djsClient = djsClient;
        this._appConfig = appConfig;

        this._ready = this._initializeBDI_Agent().catch((err) => {
            console.error(err);
            process.exit(1);
        });
    }

    private async _initializeBDI_Agent(): Promise<void> {
        await this._initializeBelief();
        await this._initializeDesire();

        this.pathFinder = new AStarPathFinder(this.belief);
    }

    waitUntilReady(): Promise<void> {
        return this._ready;
    }

    private async _initializeDesire() {
        this.desiresGenerator = new DesiresGenerator(this.belief);

        this.belief.onRelevantChangesForDesires(() => {
            this.desiresGenerator.desires = [];
            this.desiresGenerator.generate().filter();
        });
    }

    private async _initializeBelief(): Promise<void> {
        this._djsClient.onConnect(() => console.log('Connected: ' + this._djsClient.id));
        this._djsClient.onDisconnect(() => console.log('Disconnected: ' + this._djsClient.id));

        console.log("Waiting for game config, map and self sensing...");

        this.belief = await this._createInitialBelief();
        console.log("Belief initialized");

        this._wireSensingEvents();
    }

    private async _createInitialBelief(): Promise<Belief> {
        const [gameConfig, gameMap, me] = await Promise.all([
            this._waitForConfig(),
            this._waitForMap(),
            this._waitForYou(),
        ]);

        return new Belief(gameConfig, gameMap, me);
    }

    private _wireSensingEvents(): void {
        this._djsClient.onSensing((sensing) => {
            this.belief.updateBeliefs(adaptSensingPayload(sensing, this._appConfig.maxAgentHistoryPositions));
        })

        this._djsClient.onYou((you) => {
            this.belief.updateMe(adaptSelfSensingPayload(you, this._appConfig.maxAgentHistoryPositions));
        })
    }

    private _waitForConfig(): Promise<GameConfig> {
        return new Promise<GameConfig>((resolve) => {
            this._djsClient.onConfig((config) => {
                resolve(adaptConfigPayload(config));
            });
        });
    }

    private _waitForMap(): Promise<GameMap> {
        return new Promise<GameMap>((resolve) => {
            this._djsClient.onMap((_width, _height, tiles) => {
                resolve(adaptMapPayload(_width, _height, tiles));
            });
        });
    }

    private _waitForYou(): Promise<Agent> {
        return new Promise<Agent>((resolve) => {
            this._djsClient.onYou((you) => {
                resolve(adaptSelfSensingPayload(you, this._appConfig.maxAgentHistoryPositions));
            });
        });
    }

    toString() {
        let bdi_agent_str = "\n*************************************************************\n";
        bdi_agent_str += "BDI_Agent: " + this.belief.me.id + "\n";
        bdi_agent_str += "*************************************************************\n\n";

        bdi_agent_str += this.belief.toString(true, this._appConfig.showHeatMapInUI);

        bdi_agent_str += "\n\n*************************************************************\n\n";
        bdi_agent_str += "*** DESIRE ***\n\n";
        for (const desire of this.desiresGenerator.desires) {
            if (desire.goal.valid) {
                bdi_agent_str += `  - ${desire.name} (goal: ${desire.goal.position.x},${desire.goal.position.y})\n`;
            } else {
                bdi_agent_str += `  - ${desire.name} (goal: [INVALID])\n`;
            }
        }
        return bdi_agent_str;
    }
}

export {BDI_Agent}