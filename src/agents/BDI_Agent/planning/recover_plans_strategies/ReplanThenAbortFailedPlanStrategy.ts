import {
    FailedPlanResolution,
    IRecoverPlanStrategy
} from "@/agents/BDI_Agent/planning/recover_plans_strategies/IRecoverPlanStrategy";

class ReplanThenAbortFailedPlanStrategy implements IRecoverPlanStrategy {
    readonly name: string = "replan_then_abort_on_failed_plan";

    readonly maxReplans: number;
    private replans: number = 0;

    private readonly innerStrategy: IRecoverPlanStrategy;

    constructor(innerStrategy: IRecoverPlanStrategy, maxReplans: number) {
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

export { ReplanThenAbortFailedPlanStrategy };