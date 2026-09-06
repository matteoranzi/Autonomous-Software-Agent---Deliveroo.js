import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/belief_changes_detection_strategies/IChangeDetectionStrategy";
import {positionsEqual} from "@/agents/BDI_Agent/utils";

class SelfAgentMovedStrategy implements IChangeDetectionStrategy {
    readonly name = 'self_agent_moved';

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