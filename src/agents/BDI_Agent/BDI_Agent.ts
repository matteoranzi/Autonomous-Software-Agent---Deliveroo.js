import {DjsClientSocket} from "@matteoranzi/deliveroo-js-sdk/client";
import {Belief, GameMap, GameConfig} from "@/agents/BDI_Agent/beliefs/Belief"
import {adaptMapPayload} from "@/io/adapters/mapAdapter";
import {adaptSelfSensingPayload, adaptSensingPayload} from "@/io/adapters/sensingAdapter";
import {adaptConfigPayload} from "@/io/adapters/configAdapter";
import {Agent} from "@/agents/BDI_Agent/beliefs/primitives/Agent";
import {AppConfig} from "@/config";

class BDI_Agent {
    private readonly _djsClient: DjsClientSocket;
    private readonly _appConfig: AppConfig;
    private belief: Belief;

    constructor(djsClient: DjsClientSocket, appConfig: AppConfig) {
        this._djsClient = djsClient;
        this._appConfig = appConfig;

        this._initialize().catch((err) => {
            console.error(err);
            process.exit(1);
        });
    }

    private async _initialize(): Promise<void> {
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
        return this.belief.toString(true, this._appConfig.showHeatMapInUI);
    }
}

export {BDI_Agent}