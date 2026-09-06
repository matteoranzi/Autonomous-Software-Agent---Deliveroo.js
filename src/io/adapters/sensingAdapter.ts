import type {IOAgent, IOSensing} from "@matteoranzi/deliveroo-js-sdk";
import {Parcel} from "@/agents/BDI_Agent/beliefs/primitives/Parcel";
import {Agent} from "@/agents/BDI_Agent/beliefs/primitives/Agent";
import {DynamicBelief} from "@/agents/BDI_Agent/beliefs/Belief";
import {Crate} from "@/agents/BDI_Agent/beliefs/primitives/Crate";

export function adaptSensingPayload(sensing: IOSensing, maxAgentPositionsHistory: number): DynamicBelief {
    // console.log('adaptSensingPayload: adapting sensing payload', sensing);
    return {
        // Agents with no known position aren't useful sensing data; skip rather than fabricate one.
        agents: sensing.agents
            .filter((a): a is IOAgent & { x: number; y: number } => a.x !== undefined && a.y !== undefined)
            .map((a) => new Agent(a.id, a.name, { x: Math.round(a.x), y: Math.round(a.y) }, a.score, a.penalty, maxAgentPositionsHistory)),
        parcels: sensing.parcels.map((p) => new Parcel(p.id, { x: Math.round(p.x), y: Math.round(p.y) }, p.carriedBy ?? null, p.reward)),
        crates: sensing.crates.map((c) => new Crate(c.id, { x: Math.round(c.x), y: Math.round(c.y)})),
        observedPositions: sensing.positions.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
    };
}

export function adaptSelfSensingPayload(agent: IOAgent, maxAgentPositionsHistory: number): Agent {
    // console.log('adaptSelfSensingPayload: adapting self sensing payload', agent);
    if (agent.x === undefined || agent.y === undefined) {
        throw new Error('adaptSelfSensingPayload: self agent has no known position');
    }
    return new Agent(agent.id, agent.name, { x: Math.round(agent.x), y: Math.round(agent.y) }, agent.score, agent.penalty, maxAgentPositionsHistory);
}