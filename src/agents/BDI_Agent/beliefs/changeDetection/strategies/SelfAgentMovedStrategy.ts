import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";
import {AgentTileTransitionEstimator} from "@/agents/BDI_Agent/beliefs/changeDetection/estimators/AgentTileTransitionEstimator";
import {positionsEqual} from "@/agents/BDI_Agent/capabilities/utils";

class SelfAgentMovedStrategy implements IChangeDetectionStrategy {
    readonly name = 'SelfAgentMoved';

    evaluate(context: DeliberationContext): StrategyResult {

        let triggered: boolean = context.agents.moved.some(moved => {
            return (moved.agentId === context.belief.me.id
                && moved.from
                && !positionsEqual(moved.from, moved.to));
        });

        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {SelfAgentMovedStrategy};