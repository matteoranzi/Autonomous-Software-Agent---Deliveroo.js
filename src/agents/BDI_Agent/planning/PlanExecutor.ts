import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";
import {
    FailedPlanResolution,
    IRecoverFailedPlanStrategy
} from "@/agents/BDI_Agent/planning/recover_failed_plans_strategies/IRecoverFailedPlanStrategy";
import {Planner} from "@/agents/BDI_Agent/planning/Planner";
import {Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {Intention} from "@/agents/BDI_Agent/intentions/Intention";

class PlanExecutor {
    private readonly planner: Planner;
    private readonly makeRecoveryStrategy: () => IRecoverFailedPlanStrategy;

    private readonly emitAction: (action: AgentActions) => Promise<boolean>;
    private readonly getCurrentPosition: () => Position;

    private readonly intention: Intention;

    constructor(
        planner: Planner,
        makeRecoveryStrategy: () => IRecoverFailedPlanStrategy,
        intention: Intention,
        emitAction: (action: AgentActions) => Promise<boolean>,
        getCurrentPosition: () => Position
    ) {
        this.planner = planner;
        this.makeRecoveryStrategy = makeRecoveryStrategy;
        this.intention = intention;

        this.emitAction = emitAction;
        this.getCurrentPosition = getCurrentPosition;
    }

    // FIXME: Do we need a way to interrupt the execution of a plan? For example, if a new desire is added that is more important than the current one, should we stop executing the current plan and start planning for the new desire?
    async execute(): Promise<boolean> {
        // FIXME: This check is problematic if the planning process takes a long time, because the desire might change during the planning process.
        //  An external abort signal might be required.
        const initialCommittedDesire: IDesire | null = this.intention.committedDesire;
        if (!initialCommittedDesire) {
            return false;
        }

        const recoverFailedActionStrategy = this.makeRecoveryStrategy();

        const start = this.getCurrentPosition();
        let plan = await this.planner.plan(start, initialCommittedDesire);
        if (!plan || !this._isDesireStillCommittedIntention(initialCommittedDesire)) {
            return false;
        }

        let i = 0;
        while (i < plan.actions.length) {
            if (this.intention.committedDesire !== initialCommittedDesire) {
                // The current desire has changed, so the agent must stop executing the plan
                return false;
            }
            const success = await this.emitAction(plan.actions[i]);
            if (success) {
                i++;
                continue;
            }

            switch (recoverFailedActionStrategy.resolve()) {
                case FailedPlanResolution.RETRY:
                    continue;
                case FailedPlanResolution.REPLAN:
                    if (!initialCommittedDesire.isValid() || !this._isDesireStillCommittedIntention(initialCommittedDesire)) {
                        return false;
                    }
                    const replanned = await this.planner.plan(this.getCurrentPosition(), initialCommittedDesire)
                    if (!replanned) {
                        return false;
                    }
                    plan = replanned;
                    i = 0;
                    continue;
                case FailedPlanResolution.ABORT:
                    return false;
            }
        }

        // The plan has been executed successfully
        return true;
    }

    private _isDesireStillCommittedIntention(desire: IDesire): boolean {
        return desire.isValid() && this.intention.committedDesire === desire;
    }
}

export { PlanExecutor };