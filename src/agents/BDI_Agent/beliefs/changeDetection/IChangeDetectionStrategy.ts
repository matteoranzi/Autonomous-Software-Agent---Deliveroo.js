// `import type` here is erased at compile time, so this doesn't create a real runtime
// circular dependency even though Belief.ts imports from this file too.
import type {Belief} from "@/agents/BDI_Agent/beliefs/Belief";

// Why a parcel is no longer in the belief - useful for a future fuzzy evaluator that wants to
// distinguish "truly gone" from "can't currently see it", even though today's boolean
// strategies don't use it.
enum ParcelVanishReason {
    Decayed = 'decayed',
    Unobserved = 'unobserved'
}

// Plain factual diff produced by Belief.updateParcels: what changed, with no judgment about
// whether it's desire-relevant. That judgment belongs to strategies, not to the update method.
type ParcelsDiff = {
    newParcelIds: string[];
    carriedByChangedIds: string[];
    vanishedParcels: { id: string; reason: ParcelVanishReason }[];
};

// Plain factual diff produced by Belief.updateAgents.
type AgentsDiff = {
    // Agent ids that (this cycle) entered or exited a delivery tile, including a brand new
    // agent first observed already standing on one.
    enteredOrExitedDeliveryTileIds: string[];
    // Agent ids that (this cycle) entered or exited a tile currently believed to hold a parcel.
    enteredOrExitedParcelTileIds: string[];
};

function emptyParcelsDiff(): ParcelsDiff {
    return {newParcelIds: [], carriedByChangedIds: [], vanishedParcels: []};
}

function emptyAgentsDiff(): AgentsDiff {
    return {enteredOrExitedDeliveryTileIds: [], enteredOrExitedParcelTileIds: []};
}

// A strategy's own crisp output: did it fire, and how strongly/reliably. Boolean strategies
// always emit degree 0 or 1; a future fuzzy evaluator can emit anything in between.
type StrategyResult = {
    triggered: boolean;
    degree: number; // 0..1
};

// A StrategyResult plus which strategy produced it - what actually leaves Belief on the
// relevantChanges4Desires event.
type TriggeredStrategyResult = StrategyResult & { name: string };

// Bundles everything a strategy needs to decide "did something desire-relevant happen, and how
// confidently": the raw diffs from this cycle's update, read access to Belief's persistent
// state (for future strategies that need it, e.g. a rival-intent estimator reading agent
// position history), and a shared per-cycle facts registry. Strategies run in a fixed,
// registered order and each writes its own result into `facts` as a side effect, so a later
// strategy (e.g. a fuzzy evaluator) can read an earlier one's output by name instead of
// recomputing it - the "Style A" composable/blackboard approach.
type DeliberationContext = {
    belief: Belief;
    parcels: ParcelsDiff;
    agents: AgentsDiff;
    facts: Map<string, StrategyResult>;
};

interface IChangeDetectionStrategy {
    // Stable id; also the key this strategy's result is written under in context.facts.
    readonly name: string;

    evaluate(context: DeliberationContext): StrategyResult;
}

export {
    IChangeDetectionStrategy,
    DeliberationContext,
    StrategyResult,
    TriggeredStrategyResult,
    ParcelsDiff,
    AgentsDiff,
    ParcelVanishReason,
    emptyParcelsDiff,
    emptyAgentsDiff,
};