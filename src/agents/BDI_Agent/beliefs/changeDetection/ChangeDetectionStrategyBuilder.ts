import {IChangeDetectionStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {NewParcelAppearedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/NewParcelAppearedStrategy";
import {ParcelCarriedByChangedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/ParcelCarriedByChangedStrategy";
import {BelievedParcelVanishedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/BelievedParcelVanishedStrategy";
import {RivalEnteredDeliveryTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalEnteredDeliveryTileStrategy";
import {RivalEnteredParcelTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalEnteredParcelTileStrategy";
import {CrateMovedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/CrateMovedStrategy";

class ChangeDetectionStrategyBuilder {
    private readonly strategies: IChangeDetectionStrategy[] = [];

    withNewParcelAppeared(): this {
        this.strategies.push(new NewParcelAppearedStrategy());
        return this;
    }

    withParcelCarriedByChanged(): this {
        this.strategies.push(new ParcelCarriedByChangedStrategy());
        return this;
    }

    withBelievedParcelVanished(): this {
        this.strategies.push(new BelievedParcelVanishedStrategy());
        return this;
    }

    withRivalEnteredDeliveryTile(): this {
        this.strategies.push(new RivalEnteredDeliveryTileStrategy());
        return this;
    }

    withRivalEnteredParcelTile(): this {
        this.strategies.push(new RivalEnteredParcelTileStrategy());
        return this;
    }

    withCrateMoved(): this {
        this.strategies.push(new CrateMovedStrategy());
        return this;
    }

    // Escape hatch for any custom strategy without the builder needing to know about it ahead of time.
    with(strategy: IChangeDetectionStrategy): this {
        this.strategies.push(strategy);
        return this;
    }

    withDefaults(): this {
        return this
            .withNewParcelAppeared()
            .withParcelCarriedByChanged()
            .withBelievedParcelVanished()
            .withRivalEnteredDeliveryTile()
            .withRivalEnteredParcelTile()
            .withCrateMoved();
    }

    build(): IChangeDetectionStrategy[] {
        return [...this.strategies]; // defensive copy: callers can't mutate the builder's internal list after the fact
    }
}

export {ChangeDetectionStrategyBuilder};