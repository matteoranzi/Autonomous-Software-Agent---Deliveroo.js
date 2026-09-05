import {Belief} from "@/agents/BDI_Agent/beliefs/Belief";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";
import {PickupParcelDesire} from "@/agents/BDI_Agent/desires/PickupParcelDesire";
import {DeliverParcelDesire} from "@/agents/BDI_Agent/desires/DeliverParcelDesire";
import {VisitParcelSpawningTileDesire} from "@/agents/BDI_Agent/desires/VisitParcelSpawningTileDesire";

class DesiresGenerator {
    belief: Belief;
    desires: IDesire[];

    constructor(belief: Belief) {
        this.belief = belief;
        this.desires = [];
    }

    generate(): DesiresGenerator{
        for (const parcel of this.belief.parcels.values()) {
            this.desires.push( new PickupParcelDesire(this.belief, parcel.id));
        }

        if(DeliverParcelDesire.isApplicable(this.belief)) {
            for (const deliveryTile of this.belief.parcelDeliveryTiles) {
                this.desires.push( new DeliverParcelDesire(this.belief, deliveryTile));
            }
        }

        for (const spawnerTile of this.belief.parcelSpawnerTiles) {
            this.desires.push( new VisitParcelSpawningTileDesire(this.belief, spawnerTile));
        }

        return this;
    }

    regenerate(): DesiresGenerator {
        this.desires = [];
        return this.generate();
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