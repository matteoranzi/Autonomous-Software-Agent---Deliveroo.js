// beliefs/events.ts
import { EventEmitter } from 'events';

interface BeliefEvents {
    relevantChanges4Desires: () => void;
}

class TypedBeliefEmitter extends EventEmitter {
    on<K extends keyof BeliefEvents>(event: K, listener: BeliefEvents[K]): this {
        return super.on(event, listener);
    }
    emit<K extends keyof BeliefEvents>(event: K, ...args: Parameters<BeliefEvents[K]>): boolean {
        return super.emit(event, ...args);
    }
    // off<K extends keyof BeliefEvents>(event: K, ...args: Parameters<BeliefEvents[K]>): boolean {
    //     return super.off(event, ...args);
    // }
    //
    // removeListener<K extends keyof BeliefEvents>(event: K, ...args: Parameters<BeliefEvents[K]>): boolean {
    //     return super.removeListener(event, ...args);
    // }
}

export {TypedBeliefEmitter}