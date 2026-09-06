import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";
import {NavigationPath} from "@/agents/BDI_Agent/planning/pathfinding/IPathFinder";

class Plan {
    readonly navigationPath: NavigationPath;
    readonly finalAction: AgentActions | null;

    constructor(path: NavigationPath, finalAction: AgentActions | null) {
        this.navigationPath = path;
        this.finalAction = finalAction;
    }

    get isEmpty(): boolean {
        return this.navigationPath.steps.length === 0 && this.finalAction === null;
    }

    // Flat, ordered list of all actions in the plan, including the final action if it exists
    get actions(): AgentActions[] {
        let navigationActions: AgentActions[] = this.navigationPath.steps.map(step => step.action);
        return this.finalAction ? [...navigationActions, this.finalAction] : navigationActions;
    }
}
export {Plan};