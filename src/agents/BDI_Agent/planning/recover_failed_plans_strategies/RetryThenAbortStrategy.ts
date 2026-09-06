import {
    FailedPlanResolution,
    IRecoverFailedPlanStrategy
} from "@/agents/BDI_Agent/planning/recover_failed_plans_strategies/IRecoverFailedPlanStrategy";

class RetryThenAbortStrategy implements IRecoverFailedPlanStrategy {
    readonly name: string = "retry_then_abort_on_failed_plan";

    readonly maxRetries: number;
    private retries: number;

    constructor(maxRetries: number) {
        this.maxRetries = maxRetries;

        this.retries = 0;
    }

    resolve(): FailedPlanResolution {
        if (this.retries++ < this.maxRetries) {
            return FailedPlanResolution.RETRY;
        } else {
            this.retries = 0; // Reset retries for the next time this strategy is used
            return FailedPlanResolution.ABORT;
        }
    }
}

export { RetryThenAbortStrategy };