import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {
    IReconsiderationStrategy
} from "@/agents/BDI_Agent/intentions/reconsideration_policies/IReconsiderationStrategy";
import {desireIdentity} from "@/agents/BDI_Agent/intentions/utils";


class SingleMindedCommitmentStrategy implements IReconsiderationStrategy {
    readonly name: string = "single_minded_commitment";

    // single-minded commitment strategy: if the committed desire is still valid, don't change it
    async reconsider(committedDesire: IDesire, desires: IDesire[]): Promise<IDesire> {
        if (committedDesire?.isValid()) {
            return committedDesire;
        }

        return desires[0] ?? committedDesire;
    }
}

export {SingleMindedCommitmentStrategy}