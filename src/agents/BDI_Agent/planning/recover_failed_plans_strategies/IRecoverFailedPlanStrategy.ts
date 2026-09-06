enum FailedPlanResolution {
    RETRY = "RETRY",
    REPLAN = "REPLAN",
    ABORT = "ABORT"
}

interface IRecoverFailedPlanStrategy {
    readonly name: string;
    resolve(): FailedPlanResolution;
}

export { IRecoverFailedPlanStrategy, FailedPlanResolution};