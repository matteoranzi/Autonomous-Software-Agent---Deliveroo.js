import {AgentActions} from "@/agents/BDI_Agent/BDI_Agent";
import {
    FailedPlanResolution,
    IRecoverPlanStrategy
} from "@/agents/BDI_Agent/planning/recover_plans_strategies/IRecoverPlanStrategy";
import {Planner} from "@/agents/BDI_Agent/planning/Planner";
import {Position} from "@/agents/BDI_Agent/beliefs/Belief";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {Intention} from "@/agents/BDI_Agent/intentions/Intention";
import {desireIdentity} from "@/agents/BDI_Agent/intentions/utils";

class PlanExecutor {
    private readonly planner: Planner;
    private readonly makeRecoveryStrategy: () => IRecoverPlanStrategy;

    private readonly emitAction: (action: AgentActions) => Promise<boolean>;
    private readonly getCurrentPosition: () => Position;

    private readonly intention: Intention;

    constructor(
        planner: Planner,
        makeRecoveryStrategy: () => IRecoverPlanStrategy,
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

    async execute(): Promise<boolean> {
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
            if (!this._isDesireStillCommittedIntention(initialCommittedDesire)) {
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
        return desire.isValid() && desireIdentity(desire) === desireIdentity(this.intention.committedDesire);
    }
}

export { PlanExecutor };