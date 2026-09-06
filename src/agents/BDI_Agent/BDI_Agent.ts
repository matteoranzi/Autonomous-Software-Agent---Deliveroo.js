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
import {RetryThenAbortFailedPlanStrategy} from "@/agents/BDI_Agent/planning/recover_plans_strategies/RetryThenAbortFailedPlanStrategy";
import {ReplanThenAbortFailedPlanStrategy} from "@/agents/BDI_Agent/planning/recover_plans_strategies/ReplanThenAbortFailedPlanStrategy";
import {ChangeDetectionStrategyBuilder} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/ChangeDetectionStrategyBuilder";
import {TriggeredStrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {Intention} from "@/agents/BDI_Agent/intentions/Intention";
import {GreedyIntentionStrategy} from "@/agents/BDI_Agent/intentions/selection_strategies/GreedyIntentionStrategy";

import { DjsConnect } from "@matteoranzi/deliveroo-js-sdk/client";
import {PDDL_PathFinder} from "@/agents/BDI_Agent/planning/pathfinding/pddl/PDDL_PathFinder";
import {
    CLEAN_MAP_MODE,
    FROZEN_SNAPSHOT_MODE
} from "@/agents/BDI_Agent/planning/pathfinding/pddl/pddlPathfindingProblemGenerator";
import {
    SameKindHigherUtilityReconsideration
} from "@/agents/BDI_Agent/intentions/reconsideration_policies/SameKindHigherUtilityReconsideration";

enum AgentActions {
    PICKUP = "PICKUP",
    DROP = "DROP",

    MOVE_UP = "UP",
    MOVE_DOWN = "DOWN",
    MOVE_LEFT = "LEFT",
    MOVE_RIGHT = "RIGHT"
}


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
    private _deliberating = false;
    private _deliberationPending = false;

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
        this.intention = new Intention(new GreedyIntentionStrategy(this.belief), new SameKindHigherUtilityReconsideration());

        this.planner = new Planner([
            new AStarPathFinder(this.belief),
            new PDDL_PathFinder(this.belief, FROZEN_SNAPSHOT_MODE /*CLEAN_MAP_MODE*/, this._appConfig.pddlSolverMaxTimeS),
        ]);
        this.planExecutor = new PlanExecutor(
            this.planner,
            () => new ReplanThenAbortFailedPlanStrategy(new RetryThenAbortFailedPlanStrategy(1), 2), // TODO make retry/replan limits configurable
            this.intention,
            (action) => this._emitAction(action),
            () => this.belief.me.position,
        );


        // Backstop timer to ensure that desires are regenerated at least every second, even if no relevant changes are detected.
        let desiresGenerationBackstopTimer: ReturnType<typeof setInterval> = setInterval(() => {

            this._deliberationCycle();
        }, this._appConfig.backstopTimerMs)

        // Listen for relevant changes in the belief and update the desires accordingly.
        this.belief.onRelevantChangesForDesires((results : TriggeredStrategyResult[]) => {
            this._lastTriggeredStrategyResults = results;

            this._deliberationCycle();

            // Reset the backstop timer since we have detected relevant changes and updated the desires.
            desiresGenerationBackstopTimer.refresh();
        });

        // Generate initial desires and deliberate on them.
        this._deliberationCycle().finally();
    }

    private async _deliberationCycle(): Promise<void> {
        // A trigger that arrives while a cycle is already running is remembered instead of being ignored.
        if (this._deliberating) {
            this._deliberationPending = true;
            return;
        }

        this._deliberating = true;
        try {
            this.desiresGenerator.regenerate().filter()
            await this.intention.deliberate(this.desiresGenerator.desires);
        } finally {
            this._deliberating = false;
        }

        if (this._deliberationPending) {
            this._deliberationPending = false;

            await this._deliberationCycle();
        }

        // Only start a new execution if there's something committed AND nothing is already running
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
        // onSensing and onYou are separate, uncoordinated socket events - onSensing always
        // applies immediately (never blocked waiting for a sibling); onYou never applies on its
        // own, it just rides along with the next onSensing. EventEmitter.emit() is synchronous,
        // so any belief-event listener (and the deliberation cycle it may schedule) only ever
        // sees belief after both halves of a tick have landed together, with no timer needed.
        let pendingYou: Agent | null = null;

        this._djsClient.onSensing((sensing) => {
            // IMPORTANT!!! The order of these two updates is important: updateDynamicBeliefs() must be called before updateMe()
            this.belief.updateDynamicBeliefs(adaptSensingPayload(sensing, this._appConfig.maxAgentHistoryPositions));

            if (pendingYou !== null) {
                const you = pendingYou;
                pendingYou = null;
                this.belief.updateMe(you);
            }
        })

        this._djsClient.onYou((you) => {
            pendingYou = adaptSelfSensingPayload(you, this._appConfig.maxAgentHistoryPositions);
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

    async toString() {
        let bdi_agent_str = "\n*************************************************************\n";
        bdi_agent_str += "BDI_Agent: " + this.belief.me.id + "\n";
        bdi_agent_str += "*************************************************************\n\n";

        bdi_agent_str += this.belief.toString(this._appConfig.showGridMapInUI, this._appConfig.showHeatMapInUI);

        bdi_agent_str += "\n\n*************************************************************\n\n";
        bdi_agent_str += "*** DESIRE ***\n\n";
        for (const desire of this.desiresGenerator.desires) {
            if (desire.goal.valid) {
                const evaluation = await desire.evaluate();
                bdi_agent_str += `  - ${desire.name} (goal: ${desire.goal.position.x},${desire.goal.position.y}) [${evaluation.utility}]\n`;
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
                const evaluation = await this.intention.committedDesire.evaluate();
                bdi_agent_str += `  - ${this.intention.committedDesire.name} (goal: ${this.intention.committedDesire.goal.position.x},${this.intention.committedDesire.goal.position.y}) [${evaluation.utility}]\n`;
            } else {
                bdi_agent_str += `  - ${this.intention.committedDesire.name} (goal: [INVALID])\n`;
            }
        } else {
            bdi_agent_str += "  - [NO CURRENT INTENTION]\n";
        }

        bdi_agent_str += "\n\n*************************************************************\n\n";
        bdi_agent_str += `*** Deliberating: ${this._deliberating} ***\n\n`;


        return bdi_agent_str;
    }
}

export {BDI_Agent, AgentActions}