import {Goal, IDesire, IDesireEvaluation, DesireCategory} from "@/agents/BDI_Agent/desires/IDesire";

class FindFreeDeliveryTileDesire implements IDesire {
    readonly name: string;
    readonly category: DesireCategory = DesireCategory.DELIVER;
    goal: Goal;

    evaluate(): Promise<IDesireEvaluation> {
        throw new Error("FindFreeDeliveryTileDesire not implemented.");
    }

    isValid(): boolean {
        return false;
    }
}