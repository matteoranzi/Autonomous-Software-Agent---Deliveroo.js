import {IPathFinder, NavigationPath, PathfindingResult} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";
import {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {
    CLEAN_MAP_MODE, generatePddlProblem,
    MapOccupancyMode
} from "@/agents/BDI_Agent/planning/pathfinding/pddl/pddlPathfindingProblemGenerator";
import * as fs from "node:fs";
import {onlineSolver, PddlPlanStep} from "@matteoranzi/pddl-client";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDDL_PathFinder implements IPathFinder {
    readonly name: string = "PDDL_path_finder";

    private readonly belief: Belief;
    private readonly mode: MapOccupancyMode;
    private readonly domainText: string;

    private readonly maxSolvingTimeS: number;

    constructor(belief: Belief, mode: MapOccupancyMode = CLEAN_MAP_MODE, maxSolvingTimeS: number) {
        this.belief = belief;
        this.mode = mode;
        this.domainText = fs.readFileSync(path.join(__dirname, "domain.pddl"), "utf-8");
        this.maxSolvingTimeS = maxSolvingTimeS;
    }

    // TODO online update Plan (sending to PlanExecutor) when anytime planner finds a better plan (with lower cost) than the current one.
    //  if the agent moved in the meantime, the new plan has to be adapted to the new position of the agent (and possibly also to the new positions of crates and rivals).
    async findPath(start: Position, goal: Position): Promise<PathfindingResult> {
        const problem = generatePddlProblem(this.belief, start, goal, this.mode);

        const controller =new AbortController();
        let plan: PddlPlanStep[] | undefined;

        try {
            const finalPlan = await onlineSolver(this.domainText, problem.toPddlString(), {
                maxTime: this.maxSolvingTimeS,
                signal: controller.signal,
                onImprovedPlan: (improvedPlan, metric) => {
                    console.log(`[PDDL_PathFinder] Improved plan found with metric ${metric}, steps: ${improvedPlan.length}`);
                    plan = improvedPlan;
                    controller.abort();
                },
            });
            plan ??= finalPlan;
        } catch (err) {
            if (!(err instanceof DOMException && err.name === "AbortError")) {
                throw err; // a real failure, not our own deliberate abort
            }
        }

        if (!plan) {
            return {found: false};
        }

        const steps: NavigationPath["steps"] = [];
        for (const step of plan) {
            const translated = translateStep(step);
            if (!translated) continue;
            steps.push({from: parseTileName(translated.from), to: parseTileName(translated.to), action: translated.action});
        }

        return {found: true, path: {start, goal, cost: steps.length, steps}};
    }
}

// push-* ->[sokoban, crate, sokobanFromTile, crateFromTile, crateToTile]
// move-* -> [sokoban, fromTile, toTile].
function translateStep(step: PddlPlanStep): {action: AgentActions, from: string, to: string} | null {
    switch (step.action.toLocaleLowerCase()) {
        case "move-up": return {action: AgentActions.MOVE_UP, from: step.args[1], to: step.args[2]};
        case "push-up": return {action: AgentActions.MOVE_UP, from: step.args[2], to: step.args[3]};
        case "move-down": return {action: AgentActions.MOVE_DOWN, from: step.args[1], to: step.args[2]};
        case "push-down": return {action: AgentActions.MOVE_DOWN, from: step.args[2], to: step.args[3]};
        case "move-left": return {action: AgentActions.MOVE_LEFT, from: step.args[1], to: step.args[2]};
        case "push-left": return {action: AgentActions.MOVE_LEFT, from: step.args[2], to: step.args[3]};
        case "move-right": return {action: AgentActions.MOVE_RIGHT, from: step.args[1], to: step.args[2]};
        case "push-right": return {action: AgentActions.MOVE_RIGHT, from: step.args[2], to: step.args[3]};
        default: return null;
    }
}

function parseTileName(tileName: string): Position {
    const match = /^tile_(\d+)_(\d+)$/.exec(tileName);
    if (!match) {
        throw new Error(`Unexpected tile name from PDDL plan: ${tileName}`);
    }

    return {x: Number(match[1]), y: Number(match[2])};
}
export { PDDL_PathFinder };