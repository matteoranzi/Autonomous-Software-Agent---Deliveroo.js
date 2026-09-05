import {IChangeDetectionEstimator, IChangeDetectionStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {NewParcelAppearedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/NewParcelAppearedStrategy";
import {RivalAgentPickedUpParcelStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/RivalAgentPickedUpParcelStrategy";
import {RivalAgentDroppedParcelStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/RivalAgentDroppedParcelStrategy";
import {FreeParcelVanishedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/FreeParcelVanishedStrategy";
import {RivalAgentEnteredDeliveryTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/RivalAgentEnteredDeliveryTileStrategy";
import {RivalAgentEnteredParcelTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/RivalAgentEnteredParcelTileStrategy";
import {RivalAgentExitedDeliveryTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/RivalAgentExitedDeliveryTileStrategy";
import {RivalAgentExitedParcelTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/RivalAgentExitedParcelTileStrategy";
import {CrateMovedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/CrateMovedStrategy";
import {SelfAgentMovedStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/SelfAgentMovedStrategy";
import {SelfAgentEnteredDeliveryTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/SelfAgentEnteredDeliveryTileStrategy";
import {SelfAgentExitedDeliveryTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/SelfAgentExitedDeliveryTileStrategy";
import {SelfAgentEnteredParcelTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/SelfAgentEnteredParcelTileStrategy";
import {SelfAgentExitedParcelTileStrategy} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/SelfAgentExitedParcelTileStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/AgentTileTransitionEstimator";
import {ParcelCarriedByEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/ParcelCarriedByEstimator";
import {
    SelfAgentPickedUpParcelStrategy
} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/SelfAgentPickedUpParcelStrategy";
import {
    SelfAgentDroppedParcelStrategy
} from "@/agents/BDI_Agent/beliefs/changeDetection/strategies/SelfAgentDroppedParcelStrategy";

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

    withSelfAgentMoved(): this {
        this.strategies.push(new SelfAgentMovedStrategy());
        return this;
    }

    withSelfEnteredDeliveryTile(): this {
        this.strategies.push(new SelfAgentEnteredDeliveryTileStrategy());
        return this;
    }

    withSelfExitedDeliveryTile(): this {
        this.strategies.push(new SelfAgentExitedDeliveryTileStrategy());
        return this;
    }

    withSelfEnteredParcelTile(): this {
        this.strategies.push(new SelfAgentEnteredParcelTileStrategy());
        return this;
    }

    withSelfExitedParcelTile(): this {
        this.strategies.push(new SelfAgentExitedParcelTileStrategy());
        return this;
    }

    withSelfPickedUpParcel(): this {
        this.strategies.push(new SelfAgentPickedUpParcelStrategy());
        return this;
    }

    withSelfDroppedParcel(): this {
        this.strategies.push(new SelfAgentDroppedParcelStrategy());
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
            .withCrateMoved()
            .withSelfAgentMoved()
            .withSelfEnteredDeliveryTile()
            .withSelfExitedDeliveryTile()
            .withSelfEnteredParcelTile()
            .withSelfExitedParcelTile()
            .withSelfPickedUpParcel()
            .withSelfDroppedParcel();
    }

    // Estimators always precede strategies, regardless of with*() call order.
    build(): IChangeDetectionStrategy[] {
        return [...this.estimators, ...this.strategies];
    }
}

export {ChangeDetectionStrategyBuilder};