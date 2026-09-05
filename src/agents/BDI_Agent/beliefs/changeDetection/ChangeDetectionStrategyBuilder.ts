import {IChangeDetectionEstimator, IChangeDetectionStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {NewParcelAppearedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/NewParcelAppearedStrategy";
import {RivalAgentPickedUpParcelStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentPickedUpParcelStrategy";
import {RivalAgentDroppedParcelStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentDroppedParcelStrategy";
import {FreeParcelVanishedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/FreeParcelVanishedStrategy";
import {RivalAgentEnteredDeliveryTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentEnteredDeliveryTileStrategy";
import {RivalAgentEnteredParcelTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentEnteredParcelTileStrategy";
import {RivalAgentExitedDeliveryTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentExitedDeliveryTileStrategy";
import {RivalAgentExitedParcelTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/RivalAgentExitedParcelTileStrategy";
import {CrateMovedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/CrateMovedStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/AgentTileTransitionEstimator";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/ParcelCarriedByEstimator";

class ChangeDetectionStrategyBuilder {
    private readonly estimators: IChangeDetectionEstimator[] = [];
    private readonly strategies: IChangeDetectionStrategy[] = [];

    withAgentTileTransitionEstimator(): this {
        this.estimators.push(new AgentTileTransitionEstimator());
        return this;
    }

    withParcelCarriedByEstimator(): this {
        this.estimators.push(new ParcelCarriedByEstimator());
        return this;
    }

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

    // Escape hatches for custom estimators/strategies without the builder needing to know about them ahead of time.
    withEstimator(estimator: IChangeDetectionEstimator): this {
        this.estimators.push(estimator);
        return this;
    }

    with(strategy: IChangeDetectionStrategy): this {
        this.strategies.push(strategy);
        return this;
    }

    withDefaults(): this {
        return this
            .withAgentTileTransitionEstimator()
            .withParcelCarriedByEstimator()
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

    // Estimators always precede strategies, regardless of with*() call order.
    build(): IChangeDetectionStrategy[] {
        return [...this.estimators, ...this.strategies];
    }
}

export {ChangeDetectionStrategyBuilder};