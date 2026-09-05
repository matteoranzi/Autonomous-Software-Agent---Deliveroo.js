import {DeliberationContext, IChangeDetectionStrategy, StrategyResult} from "@/agents/BDI_Agent/beliefs/changeDetection/IChangeDetectionStrategy";

class NewParcelAppearedStrategy implements IChangeDetectionStrategy {
    readonly name = 'NewParcelAppeared';

    evaluate(context: DeliberationContext): StrategyResult {
        const triggered = context.parcels.newParcelIds.length > 0;
        return {triggered, degree: triggered ? 1 : 0};
    }
}

export {NewParcelAppearedStrategy};