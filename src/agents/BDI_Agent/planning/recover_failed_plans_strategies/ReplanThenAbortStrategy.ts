import {
    FailedPlanResolution,
    IRecoverFailedPlanStrategy
} from "@/agents/BDI_Agent/planning/recover_failed_plans_strategies/IRecoverFailedPlanStrategy";

class ReplanThenAbortStrategy implements IRecoverFailedPlanStrategy {
    readonly name: string = "replan_then_abort_on_failed_plan";

    readonly maxReplans: number;
    private replans: number = 0;

    private readonly innerStrategy: IRecoverFailedPlanStrategy;

    constructor(innerStrategy: IRecoverFailedPlanStrategy, maxReplans: number) {
        this.innerStrategy = innerStrategy;
        this.maxReplans = maxReplans;

        this.replans = 0;
    }

    resolve(): FailedPlanResolution {
        const innerResolution = this.innerStrategy.resolve();
        if (innerResolution !== FailedPlanResolution.ABORT) {
            return innerResolution;
        }

        if (this.replans++ < this.maxReplans) {
            return FailedPlanResolution.REPLAN;
        } else {
            this.replans = 0; // Reset replans for the next time this strategy is used
            return FailedPlanResolution.ABORT;
        }
    }
}

export { ReplanThenAbortStrategy };