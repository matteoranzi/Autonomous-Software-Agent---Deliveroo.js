import {IChangeDetectionStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {NewParcelAppearedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/NewParcelAppearedStrategy";
import {ParcelCarriedByChangedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/ParcelCarriedByChangedStrategy";
import {BelievedParcelVanishedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/BelievedParcelVanishedStrategy";
import {RivalEnteredDeliveryTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalEnteredDeliveryTileStrategy";
import {RivalEnteredParcelTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalEnteredParcelTileStrategy";

// 1:1 port of Belief's previous hardcoded importantChanges checks. None of these depend on
// facts written by another strategy, so their relative order doesn't currently matter - but a
// future fuzzy evaluator that reads an earlier strategy's fact from the registry would need to
// be listed after it.
const defaultChangeDetectionStrategies: IChangeDetectionStrategy[] = [
    new NewParcelAppearedStrategy(),
    new ParcelCarriedByChangedStrategy(),
    new BelievedParcelVanishedStrategy(),
    new RivalEnteredDeliveryTileStrategy(),
    new RivalEnteredParcelTileStrategy(),
];

export {defaultChangeDetectionStrategies};