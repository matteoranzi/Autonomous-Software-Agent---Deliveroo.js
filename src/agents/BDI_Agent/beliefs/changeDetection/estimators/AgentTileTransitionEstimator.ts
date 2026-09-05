import {DeliberationContext, IChangeDetectionEstimator, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {positionsEqual} from "@/agents/BDI_Agent/capabilities/utils";

// Interprets raw agent position deltas (self and rivals) into named facts read by other strategies.
class AgentTileTransitionEstimator implements IChangeDetectionEstimator {
    readonly name = 'AgentTileTransitionEstimator';

    static readonly ENTERED_DELIVERY_TILE = 'AgentEnteredDeliveryTile';
    static readonly EXITED_DELIVERY_TILE = 'AgentExitedDeliveryTile';
    static readonly ENTERED_PARCEL_TILE = 'AgentEnteredParcelTile';
    static readonly EXITED_PARCEL_TILE = 'AgentExitedParcelTile';

    evaluate(context: DeliberationContext): StrategyResult {
        const enteredDelivery: string[] = [];
        const exitedDelivery: string[] = [];
        const enteredParcelTile: string[] = [];
        const exitedParcelTile: string[] = [];

        // Only uncarried parcels are actually available for pickup.
        const uncarriedParcelPositions = [...context.belief.parcels.values()]
            .filter((parcel) => parcel.carriedBy === null)
            .map((parcel) => parcel.position);
        const hasUncarriedParcelAt = (position: {x: number; y: number}) =>
            uncarriedParcelPositions.some((p) => positionsEqual(p, position));

        for (const {agentId, from, to} of context.agents.moved) {
            const toTile = context.belief.map.grid[to.x][to.y];
            if (toTile.isParcelDelivery) {
                enteredDelivery.push(agentId);
            }
            if (hasUncarriedParcelAt(to)) {
                enteredParcelTile.push(agentId);
            }

            if (from !== null) {
                const fromTile = context.belief.map.grid[from.x][from.y];
                if (fromTile.isParcelDelivery) {
                    exitedDelivery.push(agentId);
                }
                if (hasUncarriedParcelAt(from)) {
                    exitedParcelTile.push(agentId);
                }
            }
        }

        context.facts.set(AgentTileTransitionEstimator.ENTERED_DELIVERY_TILE, {triggered: enteredDelivery.length > 0, degree: enteredDelivery.length > 0 ? 1 : 0, agentIds: enteredDelivery});
        context.facts.set(AgentTileTransitionEstimator.EXITED_DELIVERY_TILE, {triggered: exitedDelivery.length > 0, degree: exitedDelivery.length > 0 ? 1 : 0, agentIds: exitedDelivery});
        context.facts.set(AgentTileTransitionEstimator.ENTERED_PARCEL_TILE, {triggered: enteredParcelTile.length > 0, degree: enteredParcelTile.length > 0 ? 1 : 0, agentIds: enteredParcelTile});
        context.facts.set(AgentTileTransitionEstimator.EXITED_PARCEL_TILE, {triggered: exitedParcelTile.length > 0, degree: exitedParcelTile.length > 0 ? 1 : 0, agentIds: exitedParcelTile});

        return {triggered: false, degree: 0};
    }
}

export {AgentTileTransitionEstimator};