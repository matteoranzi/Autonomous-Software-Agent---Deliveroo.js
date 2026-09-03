import type {IOAgent, IOSensing} from "@matteoranzi/deliveroo-js-sdk";
import {Parcel} from "@/agents/BDI_Agent/beliefs/primitives/Parcel";
import {Agent} from "@/agents/BDI_Agent/beliefs/primitives/Agent";
import {DynamicBelief} from "@/agents/BDI_Agent/beliefs/Belief";

export function adaptSensingPayload(sensing: IOSensing): DynamicBelief {
    return {
        agents: sensing.agents.map((a) => new Agent(a.id, a.name, { x: Math.round(a.x), y: Math.round(a.y) }, a.score, a.penalty)),
        parcels: sensing.parcels.map((p) => new Parcel(p.id, { x: Math.round(p.x), y: Math.round(p.y) }, p.carriedBy, p.reward)),
    };
}

export function adaptSelfSensingPayload(agent: IOAgent): Agent {
    return new Agent(agent.id, agent.name, { x: Math.round(agent.x), y: Math.round(agent.y) }, agent.score, agent.penalty);
}