import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {
    IReconsiderationStrategy
} from "@/agents/BDI_Agent/intentions/reconsideration_policies/IReconsiderationStrategy";
import {desireIdentity} from "@/agents/BDI_Agent/intentions/utils";
import {FuzzyDesirabilityScorer} from "@/agents/BDI_Agent/intentions/fuzzy_logic/FuzzyDesirabilityScorer";
import {Belief} from "@/agents/BDI_Agent/beliefs/Belief";


class OpenMindedCommitmentStrategy implements IReconsiderationStrategy {
    readonly name: string = "open_minded_commitment";

    private readonly fuzzyScorer: FuzzyDesirabilityScorer;

    constructor(belief: Belief) {
        this.fuzzyScorer = new FuzzyDesirabilityScorer(belief);
    }

    // open-minded commitment strategy: if the committed desire is still valid, don't change it
    async reconsider(committedDesire: IDesire, desires: IDesire[]): Promise<IDesire> {
        let nextDesire = desires[0];
        if (!nextDesire || !nextDesire.isValid()) {
            return committedDesire;
        }

        let nextScore = await nextDesire.evaluate();
        let committedScore = await committedDesire.evaluate();

        if(this.fuzzyScorer.score(nextScore) > this.fuzzyScorer.score(committedScore)) {
            return nextDesire;
        }

        return committedDesire;
    }
}

export {OpenMindedCommitmentStrategy}