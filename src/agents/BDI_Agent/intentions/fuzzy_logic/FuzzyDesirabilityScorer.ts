//Standard fuzzy-set shapes
// - a falling "shoulder" (fully true, then fading to false),
// - a rising "shoulder" (fading in from false, to fully true)
// - a triangle in between.

import {IDesireEvaluation} from "@/agents/BDI_Agent/desires/IDesire";

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
    };
}


