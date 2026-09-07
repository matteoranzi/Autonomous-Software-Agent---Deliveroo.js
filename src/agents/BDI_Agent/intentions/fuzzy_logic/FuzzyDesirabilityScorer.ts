//Standard fuzzy-set shapes
// - a falling "shoulder" (fully true, then fading to false),
// - a rising "shoulder" (fading in from false, to fully true)
// - a triangle in between.
import {IDesireEvaluation, PRIORITY} from "@/agents/BDI_Agent/desires/IDesire";

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

// Tunable breakpoints for the fuzzy sets
// TODO calibrate and make configurable via .env
const COST_LOW_MAX =5, COST_MID_PEAK = 10, COST_HIGH_MIN = 15;
const REWARD_LOW_MAX = 5, REWARD_MID_PEAK = 15, REWARD_HIGH_MIN = 25;
const RISK_HIGH_THRESHOLD = 0.5;


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

function fuzzify(evaluation: IDesireEvaluation): Memberships {
    const cost = evaluation.estimatedCost;
    const reward = evaluation.expectedReward;
    const risk = evaluation.risk;

    return {
        costLow: lowShoulder(cost, COST_LOW_MAX, COST_MID_PEAK),
        costMed: triangle(cost, COST_LOW_MAX, COST_MID_PEAK, COST_HIGH_MIN * 2),
        costHigh: highShoulder(cost, COST_MID_PEAK, COST_HIGH_MIN),
        rewardLow: lowShoulder(reward, REWARD_LOW_MAX, REWARD_MID_PEAK),
        rewardMed: triangle(reward, REWARD_LOW_MAX, REWARD_MID_PEAK, REWARD_HIGH_MIN * 2),
        rewardHigh: highShoulder(reward, REWARD_MID_PEAK, REWARD_HIGH_MIN),
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
        {firingStrength: m.riskLow, consequent: "LOW"},
        {firingStrength: m.riskHigh, consequent: "LOW"},
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

function scoreDesirability(evaluation: IDesireEvaluation): number {
    const memberships = fuzzify(evaluation);
    const rules = evaluateRules(memberships, evaluation.urgency);
    return defuzzify(rules);
}


export {scoreDesirability};