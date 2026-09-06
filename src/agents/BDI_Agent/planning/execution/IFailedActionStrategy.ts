enum FailedMoveResolution {
    RETRY,
    REPLAN,
    ABORT
}

interface IFailedActionStrategy {
    readonly name: string;

    //TODO does the resolve need Belief/Plan/CurrentAction/Intention ?
    resolve(): FailedMoveResolution;
}

export { IFailedActionStrategy, FailedMoveResolution};