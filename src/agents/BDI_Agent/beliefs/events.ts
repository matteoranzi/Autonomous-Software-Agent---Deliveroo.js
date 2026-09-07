// beliefs/events.ts
import { EventEmitter } from 'events';
import {TriggeredStrategyResult} from "@/agents/BDI_Agent/beliefs/changes_detection_strategies/IChangeDetectionStrategy";

interface BeliefEvents {
    // Carries every strategy that reported triggered=true this cycle (empty array on the
    // initial post-construction kickoff, since that's not a detected change).
    relevantChanges4Desires: (results: TriggeredStrategyResult[]) => void;
}

class TypedBeliefEmitter extends EventEmitter {
    on<K extends keyof BeliefEvents>(event: K, listener: BeliefEvents[K]): this {
        return super.on(event, listener);
    }
    emit<K extends keyof BeliefEvents>(event: K, ...args: Parameters<BeliefEvents[K]>): boolean {
        return super.emit(event, ...args);
    }
    // off/removeListener commented out
}

export {TypedBeliefEmitter}