// `import type` here is erased at compile time, so this doesn't create a real runtime
// circular dependency even though Belief.ts imports from this file too.
import type {Belief, Position} from "@/agents/BDI_Agent/beliefs/Belief";

enum ParcelVanishReason {
    Decayed = 'decayed',
    Unobserved = 'unobserved'
}

// Plain factual diff produced by Belief.updateParcels
type ParcelsDiff = {
    newIds: string[];
    carriedByChanged: { id: string; from: string | null; to: string | null }[];
    vanished: { id: string; reason: ParcelVanishReason, carriedBy: string | null, position: Position }[];
};

// Plain factual diff produced by Belief.updateAgents/updateMe - covers self and rivals uniformly.
type AgentsDiff = {
    // from is null for an agent tracked for the first time this cycle.
    moved: { agentId: string; from: Position | null; to: Position }[];
};

// Plain factual diff produced by Belief.updateCrates.
type CratesDiff = {
    moved: { crateId: string; from: Position; to: Position }[];

    // Positions of unconfirmed seed guesses discarded this cycle (identified by position, since a seed has no real id).
    discardedSeedPositions: Position[];
}

function emptyParcelsDiff(): ParcelsDiff {
    return {newIds: [], carriedByChanged: [], vanished: []};
}

function emptyAgentsDiff(): AgentsDiff {
    return {moved: []};
}

function emptyCratesDiff(): CratesDiff {
    return {moved: [], discardedSeedPositions: []};
}

// A strategy's own output: did it fire, and how strongly/reliably.
// agentIds is optional - which agents (self and/or rivals) caused the fact, if known.
type StrategyResult = {
    triggered: boolean;
    degree: number; // 0..1
    agentIds?: string[];
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

// Same contract as IChangeDetectionStrategy - distinct name so the builder can run all estimators before other strategies.
interface IChangeDetectionEstimator extends IChangeDetectionStrategy {}

// Re-derives triggered/degree from a fact's agentIds, excluding one agent (e.g. self).
function excludingAgent(result: StrategyResult, agentId: string): StrategyResult {
    const agentIds = (result.agentIds ?? []).filter((id) => id !== agentId);
    return {triggered: agentIds.length > 0, degree: agentIds.length > 0 ? 1 : 0, agentIds};
}

// Re-derives triggered/degree from a fact's agentIds, keeping only one agent (e.g. self).
function onlyAgent(result: StrategyResult, agentId: string): StrategyResult {
    const triggered = (result.agentIds ?? []).includes(agentId);
    return {triggered, degree: triggered ? 1 : 0};
}

export {
    IChangeDetectionStrategy,
    IChangeDetectionEstimator,
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
    excludingAgent,
    onlyAgent,
};