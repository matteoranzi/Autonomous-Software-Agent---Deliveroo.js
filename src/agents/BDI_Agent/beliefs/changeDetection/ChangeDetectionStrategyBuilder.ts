import {IChangeDetectionStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {NewParcelAppearedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/NewParcelAppearedStrategy";
import {RivalAgentPickedUpParcelStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentPickedUpParcelStrategy";
import {RivalAgentDroppedParcelStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentDroppedParcelStrategy";
import {FreeParcelVanishedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/FreeParcelVanishedStrategy";
import {RivalAgentEnteredDeliveryTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentEnteredDeliveryTileStrategy";
import {RivalAgentEnteredParcelTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentEnteredParcelTileStrategy";
import {RivalAgentExitedDeliveryTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentExitedDeliveryTileStrategy";
import {RivalAgentExitedParcelTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentExitedParcelTileStrategy";
import {CrateMovedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/CrateMovedStrategy";

class ChangeDetectionStrategyBuilder {
    private readonly strategies: IChangeDetectionStrategy[] = [];

    withNewParcelAppeared(): this {
        this.strategies.push(new NewParcelAppearedStrategy());
        return this;
    }

    withRivalAgentPickedUpParcel(): this {
        this.strategies.push(new RivalAgentPickedUpParcelStrategy());
        return this;
    }

    withRivalAgentDroppedParcel(): this {
        this.strategies.push(new RivalAgentDroppedParcelStrategy());
        return this;
    }

    withFreeParcelVanished(): this {
        this.strategies.push(new FreeParcelVanishedStrategy());
        return this;
    }

    withRivalEnteredDeliveryTile(): this {
        this.strategies.push(new RivalAgentEnteredDeliveryTileStrategy());
        return this;
    }

    withRivalExitedDeliveryTile(): this {
        this.strategies.push(new RivalAgentExitedDeliveryTileStrategy());
        return this;
    }

    withRivalEnteredParcelTile(): this {
        this.strategies.push(new RivalAgentEnteredParcelTileStrategy());
        return this;
    }

    withRivalExitedParcelTile(): this {
        this.strategies.push(new RivalAgentExitedParcelTileStrategy());
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
            .withRivalAgentPickedUpParcel()
            .withRivalAgentDroppedParcel()
            .withFreeParcelVanished()
            .withRivalEnteredDeliveryTile()
            .withRivalExitedDeliveryTile()
            .withRivalEnteredParcelTile()
            .withRivalExitedParcelTile()
            .withCrateMoved();
    }

    build(): IChangeDetectionStrategy[] {
        return [...this.strategies]; // defensive copy: callers can't mutate the builder's internal list after the fact
    }
}

export {ChangeDetectionStrategyBuilder};