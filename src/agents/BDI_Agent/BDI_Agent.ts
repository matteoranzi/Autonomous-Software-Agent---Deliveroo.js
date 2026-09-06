import {DjsClientSocket} from "@matteoranzi/deliveroo-js-sdk/client";
import {Belief, GameMap, GameConfig} from "@/agents/BDI_Agent/beliefs/Belief"
import {adaptMapPayload} from "@/io/adapters/mapAdapter";
import {adaptSelfSensingPayload, adaptSensingPayload} from "@/io/adapters/sensingAdapter";
import {adaptConfigPayload} from "@/io/adapters/configAdapter";
import {Agent} from "@/agents/BDI_Agent/beliefs/primitives/Agent";
import {AgentConfig} from "@/config";
import {DesiresGenerator} from "@/agents/BDI_Agent/desires/DesiresGenerator";
import {AStarPathFinder} from "@/agents/BDI_Agent/planning/pathfinding/AStarPathFinder";
import {Planner} from "@/agents/BDI_Agent/planning/Planner";
import {PlanExecutor} from "@/agents/BDI_Agent/planning/PlanExecutor";
import {RetryThenAbortStrategy} from "@/agents/BDI_Agent/planning/recover_failed_plans_strategies/RetryThenAbortStrategy";
import {ReplanThenAbortStrategy} from "@/agents/BDI_Agent/planning/recover_failed_plans_strategies/ReplanThenAbortStrategy";
import {ChangeDetectionStrategyBuilder} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/ChangeDetectionStrategyBuilder";
import {TriggeredStrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {Intention} from "@/agents/BDI_Agent/intentions/Intention";
import {HighestScoreIntentionStrategy} from "@/agents/BDI_Agent/intentions/HighestScoreIntentionStrategy";

import { DjsConnect } from "@matteoranzi/deliveroo-js-sdk/client";
import {PDDL_PathFinder} from "@/agents/BDI_Agent/planning/pathfinding/pddl/PDDL_PathFinder";
import {CLEAN_MAP_MODE} from "@/agents/BDI_Agent/planning/pathfinding/pddl/pddlPathfindingProblemGenerator";

enum AgentActions {
    PICKUP = "PICKUP",
    DROP = "DROP",

    MOVE_UP = "UP",
    MOVE_DOWN = "DOWN",
    MOVE_LEFT = "LEFT",
    MOVE_RIGHT = "RIGHT"
}

// TODO: exploration strategy: find a tile that maximizes the number of unknown tiles in the sensing radius, and move towards it. If there are multiple such tiles, choose the closest one. If there are no such tiles, choose a random tile that is not a wall and is not occupied by another agent.
//  such exploration strategy in some scenarios should be preferred over pickup (e.g. in an area where there are directional tiles and so the agent will "look-ahead" and see if in other areas is there anything interesting)
class BDI_Agent {
    private readonly _djsClient: DjsClientSocket;
    private readonly _appConfig: AgentConfig;

    private belief: Belief;

    private _lastTriggeredStrategyResults: TriggeredStrategyResult[] = [];

    private desiresGenerator: DesiresGenerator;
    private intention: Intention;

    private planner: Planner;
    private planExecutor: PlanExecutor;
    private _executing = false;

    constructor(config: AgentConfig) {
        this._djsClient = DjsConnect(config.host, config.token);
        this._appConfig = config;
    }

    async start(): Promise<void> {
        let ready = await this._initializeBelief().catch((err) => {
            console.error(err);
            process.exit(1);
        });

        this._run().catch((err) => {
            console.error(err);
            process.exit(2);
        }).finally(() => {});

        return ready;
    }

    private async _run() {
        this.desiresGenerator = new DesiresGenerator(this.belief);
        this.intention = new Intention(new HighestScoreIntentionStrategy());

        this.planner = new Planner([
            new AStarPathFinder(this.belief),
            new PDDL_PathFinder(this.belief, CLEAN_MAP_MODE, this._appConfig.pddlSolverMaxTimeS),
        ]);
        this.planExecutor = new PlanExecutor(
            this.planner,
            () => new ReplanThenAbortStrategy(new RetryThenAbortStrategy(0), 2), // TODO make retry/replan limits configurable
            this.intention,
            (action) => this._emitAction(action),
            () => this.belief.me.position,
        );


        // Backstop timer to ensure that desires are regenerated at least every second, even if no relevant changes are detected.
        let desiresGenerationBackstopTimer: ReturnType<typeof setInterval> = setInterval(() => {

            this._deliberationCycle();
        }, this._appConfig.backstopTimerMs) // TODO make this configurable

        // Listen for relevant changes in the belief and update the desires accordingly.
        this.belief.onRelevantChangesForDesires((results : TriggeredStrategyResult[]) => {
            this._lastTriggeredStrategyResults = results;

            this._deliberationCycle();

            // Reset the backstop timer since we have detected relevant changes and updated the desires.
            desiresGenerationBackstopTimer.refresh();
        });

        // Generate initial desires and deliberate on them.
        this._deliberationCycle();
    }

    private _deliberationCycle() {
        this.desiresGenerator.regenerate().filter()

        // Deliberate on every cycle regardless of whether we're currently executing
        // PlanExecutor's own interruption check depends on `committedDesire` staying live/up to date while a plan runs.
        this.intention.deliberate(this.desiresGenerator.desires);

        // Only start a new execution if the commitment actually changed AND nothing is already running
        if (!this.intention.committedDesire || this._executing) {
            return;
        }

        this._executing = true;
        this.planExecutor.execute().finally(() => {
            this._executing = false;
            this._deliberationCycle();
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

        const changeDetectionStrategies = new ChangeDetectionStrategyBuilder()
            .withDefaults()
            .build();

        return new Belief(gameConfig, gameMap, me, changeDetectionStrategies);
    }

    private _wireSensingEvents(): void {
        this._djsClient.onSensing((sensing) => {
            this.belief.updateDynamicBeliefs(adaptSensingPayload(sensing, this._appConfig.maxAgentHistoryPositions));
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

    private async _emitAction(action: AgentActions): Promise<boolean> {
        switch (action) {
            case AgentActions.MOVE_UP: return !!(await this._djsClient.emitMove("up"));
            case AgentActions.MOVE_DOWN: return !!(await this._djsClient.emitMove("down"));
            case AgentActions.MOVE_LEFT: return !!(await this._djsClient.emitMove("left"));
            case AgentActions.MOVE_RIGHT: return !!(await this._djsClient.emitMove("right"));
            case AgentActions.PICKUP: return (await this._djsClient.emitPickup()).length > 0;
            case AgentActions.DROP: return (await this._djsClient.emitPutdown()).length > 0;
        }
    }

    toString() {
        let bdi_agent_str = "\n*************************************************************\n";
        bdi_agent_str += "BDI_Agent: " + this.belief.me.id + "\n";
        bdi_agent_str += "*************************************************************\n\n";

        bdi_agent_str += this.belief.toString(this._appConfig.showGridMapInUI, this._appConfig.showHeatMapInUI);

        bdi_agent_str += "\n\n*************************************************************\n\n";
        bdi_agent_str += "*** DESIRE ***\n\n";
        for (const desire of this.desiresGenerator.desires) {
            if (desire.goal.valid) {
                bdi_agent_str += `  - ${desire.name} (goal: ${desire.goal.position.x},${desire.goal.position.y})\n`;
            } else {
                bdi_agent_str += `  - ${desire.name} (goal: [INVALID])\n`;
            }
        }
        bdi_agent_str += "\n\n*************************************************************\n\n";
        bdi_agent_str += "*** LATEST TRIGGERED BELIEF CHANGED STRATEGIES ***\n\n";
        for (const result of this._lastTriggeredStrategyResults) {
            bdi_agent_str += `  - ${result.name} (degree: ${result.degree})\n`;
        }

        bdi_agent_str += "\n\n*************************************************************\n\n";
        bdi_agent_str += "*** INTENTION ***\n\n";
        if (this.intention.committedDesire) {
            if (this.intention.committedDesire.goal.valid) {
                bdi_agent_str += `  - ${this.intention.committedDesire.name} (goal: ${this.intention.committedDesire.goal.position.x},${this.intention.committedDesire.goal.position.y})\n`;
            } else {
                bdi_agent_str += `  - ${this.intention.committedDesire.name} (goal: [INVALID])\n`;
            }
        } else {
            bdi_agent_str += "  - [NO CURRENT INTENTION]\n";
        }


        return bdi_agent_str;
    }
}

export {BDI_Agent, AgentActions}