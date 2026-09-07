//Standard fuzzy-set shapes
// - a falling "shoulder" (fully true, then fading to false),
// - a rising "shoulder" (fading in from false, to fully true)
// - a triangle in between.
import {IDesireEvaluation, PRIORITY} from "@/agents/BDI_Agent/desires/IDesire";
import {Belief} from "@/agents/BDI_Agent/beliefs/Belief";

function lowShoulder(x: number, fullyTrueUntil: number, fadesOutBy: number): number {
    if (x <= fullyTrueUntil) return 1;
    if (x >= fadesOutBy) return 0;
    return (fadesOutBy - x) / (fadesOutBy - fullyTrueUntil);
}

function highShoulder(x: number, fadesInFrom: number, fullyTrueFrom: number): number {
    if (x <= fadesInFrom) return 0;
    if (x >= fullyTrueFrom) return 1;
    return (x - fadesInFrom) / (fullyTrueFrom - fadesInFrom);
}

function triangle(x: number, risesFrom: number, peak: number, fallsTo: number): number {
    if (x <= risesFrom || x >= fallsTo) return 0;
    if (x === peak) return 1;
    return x < peak ?
        ((x - risesFrom) / (peak - risesFrom))
        : ((fallsTo - x) / (fallsTo - peak));
}

// Breakpoints for the cost/reward fuzzy sets, derived from the live game's own scale instead of
// fixed magic numbers - map size and parcel reward distribution both come from gameConfig/map,
// which are only known at runtime and can differ from match to match. Computed once per Belief
// (mirrors CostEstimator's one-instance-per-search lifetime).
type FuzzyScale = {
    costLowMax: number, costMidPeak: number, costHighMin: number,
    rewardLowMax: number, rewardMidPeak: number, rewardHighMin: number,
};

// TODO calibrate these fractions/multipliers further against real runs (see [FUZZY-CALIBRATE] logs)
function computeScale(belief: Belief): FuzzyScale {
    // Manhattan-ish upper bound (width+height), not the Euclidean diagonal: real A* cost on a grid
    // with obstacles/crates regularly exceeds straight-line distance - on a 30x30 map with reward
    // 30, observed real costs ranged up to 58, far past sqrt(30^2+30^2)=42, but close to 30+30=60.
    const maxTraversalCost = belief.map.width + belief.map.height;
    const rewardAvg = belief.gameConfig.parcel.reward_average;

    // Not reward_average +/- sqrt(reward_variance): reward_variance can legitimately be 0 (every
    // parcel spawns at the same fixed reward, only decay lowers it from there), which collapsed all
    // three breakpoints onto the same value and made rewardLow/rewardHigh fire simultaneously at
    // reward=rewardAvg. Using rewardAvg itself as the "one parcel" unit stays meaningful either way -
    // deliverParcelDesire sums rewards of everything carried, so a delivery of 2+ parcels should
    // read as HIGH even when every individual parcel has the exact same reward.
    return {
        costLowMax: maxTraversalCost * 0.15,
        costMidPeak: maxTraversalCost * 0.30,
        costHighMin: maxTraversalCost * 0.50,
        rewardLowMax: rewardAvg * 0.3,
        rewardMidPeak: rewardAvg,
        rewardHighMin: rewardAvg * 1.75,
    };
}

// risk is a normalized [0,1] signal by convention (not map/config-dependent), so this stays fixed
const RISK_HIGH_THRESHOLD = 0.7;


//=========================
// Fuzzification

type Memberships = {
    costLow: number,
    costMed: number,
    costHigh: number,
    rewardLow: number,
    rewardMed: number,
    rewardHigh: number,
    riskHigh: number,
    riskLow: number,
};

function fuzzify(evaluation: IDesireEvaluation, scale: FuzzyScale): Memberships {
    const cost = evaluation.estimatedCost;
    const reward = evaluation.expectedReward;
    const risk = evaluation.risk;

    return {
        costLow: lowShoulder(cost, scale.costLowMax, scale.costMidPeak),
        costMed: triangle(cost, scale.costLowMax, scale.costMidPeak, scale.costHighMin * 2),
        costHigh: highShoulder(cost, scale.costMidPeak, scale.costHighMin),
        rewardLow: lowShoulder(reward, scale.rewardLowMax, scale.rewardMidPeak),
        rewardMed: triangle(reward, scale.rewardLowMax, scale.rewardMidPeak, scale.rewardHighMin * 2),
        rewardHigh: highShoulder(reward, scale.rewardMidPeak, scale.rewardHighMin),
        riskHigh: risk >= RISK_HIGH_THRESHOLD ? 1 : 0,
        riskLow: risk < RISK_HIGH_THRESHOLD ? 1 : 0,
    };
}

//=========================
// Mamdani fuzzy inference rules

type Consequent = "LOW" | "MEDIUM" | "HIGH";
type Rule = {firingStrength: number, consequent: Consequent};

//TODO tune the rules
function evaluateRules(m: Memberships, urgency: PRIORITY): Rule[] {
    return [
        {firingStrength: Math.min(m.costLow, m.rewardHigh), consequent: "HIGH"},
        {firingStrength: Math.min(m.costLow, m.rewardMed), consequent: "HIGH"},
        {firingStrength: Math.min(m.costMed, m.rewardHigh), consequent: "HIGH"},
        {firingStrength: Math.min(m.costLow, m.rewardLow), consequent: "MEDIUM"},
        {firingStrength: Math.min(m.costMed, m.rewardMed), consequent: "MEDIUM"},
        {firingStrength: Math.min(m.costHigh, m.rewardHigh), consequent: "MEDIUM"},
        {firingStrength: Math.min(m.costHigh, m.rewardLow), consequent: "LOW"},
        {firingStrength: Math.min(m.costHigh, m.rewardMed), consequent: "LOW"},
        // risk rules removed for now: every desire hardcodes risk=0 (see IDesire.ts), so riskLow
        // fired at strength 1 on every single evaluation, uniformly dragging every score toward LOW
        // regardless of cost/reward. Re-add once something actually populates a non-zero risk.
        {firingStrength: urgency === PRIORITY.HIGH ? 1 : 0, consequent: "HIGH"},
        {firingStrength: urgency === PRIORITY.LOW ? 1 : 0, consequent: "LOW"},
    ]
}


//=========================
// Defuzzification

// Output universe [0, 100] - an internal scale only, used to rank desires against each other.
function outputMembership(consequent: Consequent, x: number): number {
    switch (consequent) {
        case "LOW": return lowShoulder(x, 20, 40);
        case "MEDIUM": return triangle(x, 20, 50, 80);
        case "HIGH": return highShoulder(x, 60, 80);
    }
}

// Mamdani: clip each rule's output set at its fining strength, aggregate via max (fuzzy union),
// then defuzzify via centroid (sampled numerically over the output range).
function defuzzify(rules: Rule[]): number {
    let numerator = 0;
    let denominator = 0;

    for (let x = 0; x <= 100; x += 1) {
        let aggregated = 0;
        for (const rule of rules) {
            if (rule.firingStrength === 0) continue;
            const clipped = Math.min(rule.firingStrength, outputMembership(rule.consequent, x));
            aggregated = Math.max(aggregated, clipped);
        }
        numerator += x * aggregated;
        denominator += aggregated;
    }
    return denominator === 0 ? 0 : numerator / denominator;
}

// One instance per search (or per Belief), so the scale is computed once from the live
// gameConfig/map rather than re-derived (or hardcoded) per evaluation.
class FuzzyDesirabilityScorer {
    private readonly scale: FuzzyScale;

    constructor(belief: Belief) {
        this.scale = computeScale(belief);
    }

    score(evaluation: IDesireEvaluation): number {
        const memberships = fuzzify(evaluation, this.scale);
        const rules = evaluateRules(memberships, evaluation.urgency);
        const score = defuzzify(rules);
        _recordCalibration(evaluation, score, this.scale);
        return score;
    }
}

//=========================
// Calibration instrumentation - logs the real observed cost/reward/score range per
// desire category, alongside the scale they were judged against, so the fractions/multipliers in
// computeScale can be set from data.
type CalibrationStats = {count: number, minCost: number, maxCost: number, minReward: number, maxReward: number, minScore: number, maxScore: number};
const _calibrationStats = new Map<string, CalibrationStats>();
let _calibrationTicks = 0;

function _recordCalibration(evaluation: IDesireEvaluation, score: number, scale: FuzzyScale): void {
    const stats = _calibrationStats.get(evaluation.category)
        ?? {count: 0, minCost: Infinity, maxCost: -Infinity, minReward: Infinity, maxReward: -Infinity, minScore: Infinity, maxScore: -Infinity};

    stats.count++;
    if (evaluation.estimatedCost !== Infinity) {
        stats.minCost = Math.min(stats.minCost, evaluation.estimatedCost);
        stats.maxCost = Math.max(stats.maxCost, evaluation.estimatedCost);
    }
    stats.minReward = Math.min(stats.minReward, evaluation.expectedReward);
    stats.maxReward = Math.max(stats.maxReward, evaluation.expectedReward);
    stats.minScore = Math.min(stats.minScore, score);
    stats.maxScore = Math.max(stats.maxScore, score);
    _calibrationStats.set(evaluation.category, stats);

    // if (++_calibrationTicks % 200 === 0) {
    //     console.log("[FUZZY-CALIBRATE] scale:", JSON.stringify(scale), "stats:", JSON.stringify(Object.fromEntries(_calibrationStats)));
    // }
}

export {FuzzyDesirabilityScorer};