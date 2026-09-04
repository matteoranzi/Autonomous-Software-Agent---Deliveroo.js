import {Position, Belief} from "@/agents/BDI_Agent/beliefs/Belief";

enum MoveDirection {
    UP = "UP",
    DOWN = "DOWN",
    LEFT = "LEFT",
    RIGHT = "RIGHT"
}

type NavigationPath = {
    start: Position,
    goal: Position,
    cost: number,
    path: {
        from: Position,
        to: Position,
        action: MoveDirection,
    }[]
}

type PathfindingResult =
    | {found: true; path: NavigationPath}
    | {found: false}

interface IPathFinder {
    findPath(start: Position, goal: Position): Promise<PathfindingResult>;
}

export {IPathFinder, PathfindingResult, NavigationPath, MoveDirection};