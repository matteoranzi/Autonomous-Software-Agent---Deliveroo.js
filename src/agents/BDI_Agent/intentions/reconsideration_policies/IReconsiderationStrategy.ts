import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";

interface IReconsiderationStrategy {
    readonly name: string;

    // Decides what to commit next. Returns committedDesire unchanged if no reconsideration is needed.
    reconsider(committedDesire: IDesire, desires: IDesire[]): Promise<IDesire>;
}

export {IReconsiderationStrategy};