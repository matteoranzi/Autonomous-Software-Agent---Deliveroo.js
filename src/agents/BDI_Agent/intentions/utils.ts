
// Desires are re-instantiated from scratch every regenerate() cycle, so comparing them by
// name + goal position instead, which is stable across regenerations.
import {IIntentionStrategy} from "@/agents/BDI_Agent/intentions/selection_strategies/IIntentionStrategy";
import {IDesire} from "@/agents/BDI_Agent/desires/IDesire";

function desireIdentity(desire: IDesire | null): string {
    if (!desire || !desire.goal.valid) {
        return "none";
    }
    return `${desire.name}:${desire.goal.position.x},${desire.goal.position.y}`;
}

// Evaluates every desire once (in parallel) and returns the one with the highest utility, paired
// with its already-computed utility so callers don't need to call evaluate() on it again.
async function pickHighestUtility(desires: IDesire[]): Promise<{desire: IDesire, utility: number} | null> {
    if (desires.length === 0) {
        return null;
    }

    const scored = await Promise.all(desires.map(async (desire) => ({desire, utility: (await desire.evaluate()).utility})));
    return scored.reduce((top, current) => current.utility > top.utility ? current : top);
}

export {desireIdentity, pickHighestUtility}