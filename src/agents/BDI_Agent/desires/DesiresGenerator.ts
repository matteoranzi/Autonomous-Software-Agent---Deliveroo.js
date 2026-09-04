import {Belief} from "@/agents/BDI_Agent/beliefs/Belief";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {PickupParcelDesire} from "@/agents/BDI_Agent/desires/PickupParcelDesire";

class DesiresGenerator {
    belief: Belief;
    desires: IDesire[];

    constructor(belief: Belief) {
        this.belief = belief;
        this.desires = [];
    }

    generate(): DesiresGenerator{
        for (const parcel of this.belief.parcels.values()) {
            let desire = new PickupParcelDesire(this.belief, parcel.id);
            if (desire.isValid()) {
                this.desires.push(desire);
            }
        }
        return this;
    }

    filter(): DesiresGenerator {
        this.desires = this.desires.filter((desire) => desire.isValid());
        return this;
    }

    score(): DesiresGenerator {
        return this
    }
}

export {DesiresGenerator}