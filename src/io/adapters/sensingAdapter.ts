import type {IOSensing} from "@matteoranzi/deliveroo-js-sdk";
import {Parcel} from "@/agents/BDI_Agent/beliefs/primitives/Parcel";
import {Agent} from "@/agents/BDI_Agent/beliefs/primitives/Agent";
import {DynamicBelief} from "@/agents/BDI_Agent/beliefs/Belief";

export function adaptSensingPayload(sensing: IOSensing): DynamicBelief {
    return {
        agents: sensing.agents.map((a) => new Agent(a.id, a.name, { x: a.x, y: a.y }, a.score, a.penalty)),
        parcels: sensing.parcels.map((p) => new Parcel(p.id, { x: p.x, y: p.y }, p.carriedBy, p.reward)),
    };
}