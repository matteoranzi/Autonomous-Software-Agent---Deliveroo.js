enum FailedPlanResolution {
    RETRY = "RETRY",
    REPLAN = "REPLAN",
    ABORT = "ABORT"
}

interface IRecoverPlanStrategy {
    readonly name: string;
    resolve(): FailedPlanResolution;
}

export { IRecoverPlanStrategy, FailedPlanResolution};