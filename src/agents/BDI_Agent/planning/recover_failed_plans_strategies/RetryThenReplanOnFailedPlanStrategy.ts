import {FailedMoveResolution, IRecoverFailedActionStrategy} from "@/agents/BDI_Agent/planning/execution/IRecoverFailedPlanStrategy";

class RetryThenReplanOnFailedPlanStrategy implements IRecoverFailedActionStrategy {
    readonly name: string = "RetryThenReplanOnFailedPlan";

    readonly maxRetries: number;
    private retries: number;

    constructor(maxRetries: number) {
        this.maxRetries = maxRetries;
        this.retries = 0;
    }

    resolve(): FailedMoveResolution {
        if (this.retries++ < this.maxRetries) {
            return FailedMoveResolution.RETRY;
        } else {
            this.retries = 0; // Reset retries for the next time this strategy is used
            return FailedMoveResolution.REPLAN;
        }
    }
}

export { RetryThenReplanOnFailedPlanStrategy };