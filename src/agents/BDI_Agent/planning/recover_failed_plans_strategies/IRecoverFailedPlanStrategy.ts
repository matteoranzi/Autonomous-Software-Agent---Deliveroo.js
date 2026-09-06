enum FailedMoveResolution {
    RETRY,
    REPLAN,
    ABORT
}

interface IRecoverFailedPlanStrategy {
    readonly name: string;

    //TODO does the resolve need Belief/Plan/CurrentAction/Intention ?
    resolve(): FailedMoveResolution;
}

export { IRecoverFailedPlanStrategy, FailedMoveResolution};