// `import type` here is erased at compile time, so this doesn't create a real runtime
// circular dependency even though Belief.ts imports from this file too.
import type {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";

enum ParcelVanishReason {
    Decayed = 'decayed',
    Unobserved = 'unobserved'
}

// Plain factual diff produced by Belief.updateParcels
type ParcelsDiff = {
    newParcelIds: string[];
    carriedByChangedIds: string[];
    vanishedParcels: { id: string; reason: ParcelVanishReason }[];
};

// Plain factual diff produced by Belief.updateAgents.
type AgentsDiff = {
    // Agent ids that (this cycle) entered or exited a delivery tile.
    enteredDeliveryTileIds: string[];
    exitedDeliveryTileIds: string[];

    // Agent ids that (this cycle) entered or exited a tile currently believed to have a parcel on it.
    enteredParcelTileIds: string[];
    exitedParcelTileIds: string[];
};

// Plain factual diff produced by Belief.updateCrates.
type CratesDiff = {
    // Crate ids whose position changed (this cycle)
    movedCrateIds: string[];

    // Positions of unconfirmed seed guesses (crates never actually observed, only inferred from
    // the map's crate-spawner tiles) discarded this cycle because sensing observed the position
    // and found no crate there. Identified by position, not id, since a seed has no real id.
    discardedSeedPositions: Position[];
}

function emptyParcelsDiff(): ParcelsDiff {
    return {newParcelIds: [], carriedByChangedIds: [], vanishedParcels: []};
}

function emptyAgentsDiff(): AgentsDiff {
    return {enteredDeliveryTileIds: [], exitedDeliveryTileIds: [], enteredParcelTileIds: [], exitedParcelTileIds: []};
}

function emptyCratesDiff(): CratesDiff {
    return {movedCrateIds: [], discardedSeedPositions: []};
}

// A strategy's own output: did it fire, and how strongly/reliably.
// Boolean strategies always emit degree 0 or 1;
type StrategyResult = {
    triggered: boolean;
    degree: number; // 0..1
};

// A StrategyResult plus which strategy produced it
type TriggeredStrategyResult = StrategyResult & { name: string };

// Bundles everything a strategy needs to decide "did something desire-relevant happen, and how
// confidently": the raw diffs from this cycle's update, read access to Belief's persistent
// state (ford strategies that need it, e.g. a rival-intent estimator reading agent
// position history), and a shared per-cycle facts registry. Strategies run in a fixed,
// registered order and each writes its own result into `facts` as a side effect, so a later
// strategy can read an earlier one's output by name instead of recomputing it.
type DeliberationContext = {
    belief: Belief;
    parcels: ParcelsDiff;
    agents: AgentsDiff;
    crates: CratesDiff;
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
    CratesDiff,
    ParcelVanishReason,
    emptyParcelsDiff,
    emptyAgentsDiff,
    emptyCratesDiff,
};