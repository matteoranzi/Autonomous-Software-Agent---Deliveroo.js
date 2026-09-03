import {IOConfig} from "@matteoranzi/deliveroo-js-sdk";
import {PlayerConfig, ParcelsConfig, GameConfig} from "@/agents/BDI_Agent/beliefs/Belief";

const DURATION_UNIT_TO_MS: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };

function parseDurationToMs(duration: string): number {
    if (duration === 'infinite') {
        return Infinity;
    }
    if (duration === 'frame') {
        return 0;
    }

    const match = /^(\d+(?:\.\d+)?)(ms|s|m|h)?$/.exec(duration);
    if (!match) {
        throw new Error(`Invalid duration format: "${duration}"`);
    }
    const [, value, unit = 'ms'] = match;
    return parseFloat(value) * DURATION_UNIT_TO_MS[unit];
}

export function adaptConfigPayload(config: IOConfig): GameConfig {
    const playerConfig: PlayerConfig = {
        movement_duration: config["GAME"]["player"].movement_duration,
        observation_distance: config["GAME"]["player"].observation_distance,
        capacity: config["GAME"]["player"].capacity,
    }
    const parcelsConfig: ParcelsConfig = {
        generation_event: parseDurationToMs(config["GAME"]["parcels"].generation_event),
        decay_interval: parseDurationToMs(config["GAME"]["parcels"].decaying_event),
        max_parcels: config["GAME"]["parcels"].max,
        reward_average: config["GAME"]["parcels"].reward_avg,
        reward_variance: config["GAME"]["parcels"].reward_variance,
    }

    return {
        map_name: config["GAME"].description,
        clock: config["CLOCK"],
        max_players: config["GAME"].maxPlayers,
        agent: playerConfig,
        parcel: parcelsConfig,
    }
}