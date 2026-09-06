import {Position, Belief} from "@/agents/BDI_Agent/beliefs/Belief";
import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";

type NavigationPath = {
    start: Position,
    goal: Position,
    cost: number,
    steps: {
        from: Position,
        to: Position,
        action: AgentActions,
    }[]
}

type PathfindingResult =
    | {found: true; path: NavigationPath}
    | {found: false}

interface IPathFinder {
    readonly name: string;

    findPath(start: Position, goal: Position): Promise<PathfindingResult>;
}

export {IPathFinder, PathfindingResult, NavigationPath};