import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {
    IReconsiderationStrategy
} from "@/agents/BDI_Agent/intentions/reconsideration_policies/IReconsiderationStrategy";
import {desireIdentity, pickHighestUtility} from "@/agents/BDI_Agent/intentions/utils";


class SameKindHigherUtilityReconsideration implements IReconsiderationStrategy {
    readonly name: string = "same_kind_higher_utility";

    async reconsider(committedDesire: IDesire, desires: IDesire[]): Promise<IDesire> {

        const sameKindDesires = desires.filter((desire) => {
            return desire.name === committedDesire.name && desireIdentity(desire) !== desireIdentity(committedDesire);
        });

        const best = await pickHighestUtility(sameKindDesires);
        if (!best) {
            return committedDesire;
        }

        const committedUtility = (await committedDesire.evaluate()).utility;

        if (best.desire.isValid() && best.utility > committedUtility) {
            return best.desire;
        }

        return committedDesire;
    }
}

export {SameKindHigherUtilityReconsideration}