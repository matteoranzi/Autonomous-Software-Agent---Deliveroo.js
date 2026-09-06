enum FailedMoveResolution {
    RETRY,
    REPLAN,
    ABORT
}

interface IRecoverFailedActionStrategy {
    readonly name: string;

    //TODO does the resolve need Belief/Plan/CurrentAction/Intention ?
    resolve(): FailedMoveResolution;
}

export { IRecoverFailedActionStrategy, FailedMoveResolution};