// tools.js
// High-level tool functions, called directly by parser.js when executing a plan.
// Ollama never calls these — it only outputs the JSON plan; parser.js does the dispatch.

import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { stepToward } from './functions.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_FILE = path.join(__dirname, 'memory.txt'); // same file promptBuilder.js reads

const AGENT4_MCP_URL = process.env.AGENT4_MCP_URL
    ?? `http://localhost:${process.env.AGENT4_MCP_PORT ?? 3001}/mcp`;

// ── Yield control back to Node's event loop ──────────────────────────────────
function releaseEventLoop(ms = 50) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── MCP client helper (server is stateless → fresh client per call) ─────────

async function callAgent4Tool(name, args = {}) {
    const transport = new StreamableHTTPClientTransport(new URL(AGENT4_MCP_URL));
    const client = new Client({ name: 'matteo-tools-client', version: '1.0.0' });

    try {
        await client.connect(transport);
        const res = await client.callTool({ name, arguments: args });

        const raw = res?.content?.[0]?.text;
        if (!raw) return { success: false, message: 'agent4: empty MCP response' };

        const parsed = JSON.parse(raw);
        return {
            success: parsed.success ?? !parsed.error,
            message: parsed.message ?? parsed.error ?? JSON.stringify(parsed),
            raw: parsed, // keep full object around (carrying, parcelsVisible, etc.)
        };
    } catch (e) {
        return { success: false, message: `agent4 MCP error: ${e.message}` };
    } finally {
        await transport.close().catch(() => {});
    }
}

// ── Local tools (Matteo, this process) — signature: (agent, args) ───────────

export async function move_to(agent, args = {}) {
    const { x, y } = args;
    const target = { x, y };

    const MAX_FAILED_STEPS = 5;   // consecutive step failures before giving up
    const MAX_STUCK_STEPS  = 5;   // consecutive no-progress steps before giving up
    const MAX_TOTAL_STEPS  = 200; // hard cap to avoid infinite loops

    let consecutiveFailures = 0;
    let consecutiveStuck = 0;
    let totalSteps = 0;
    let lastPos = { ...agent.world.me };

    while (!agent.world.isAt(target)) {
        if (totalSteps++ >= MAX_TOTAL_STEPS) {
            return { success: false, message: `gave up after ${MAX_TOTAL_STEPS} steps moving to (${x},${y})` };
        }

        const moved = await stepToward(agent, target);

        if (!moved) {
            consecutiveFailures++;
            if (consecutiveFailures >= MAX_FAILED_STEPS) {
                return { success: false, message: `blocked or no path to (${x},${y}) after ${consecutiveFailures} failed attempts` };
            }
            await releaseEventLoop(150); // brief backoff, let the world/other agents move
            continue;
        }
        consecutiveFailures = 0;

        const currentPos = { ...agent.world.me };
        const madeProgress = currentPos.x !== lastPos.x || currentPos.y !== lastPos.y;

        if (!madeProgress) {
            consecutiveStuck++;
            if (consecutiveStuck >= MAX_STUCK_STEPS) {
                return { success: false, message: `stuck at (${currentPos.x},${currentPos.y}) trying to reach (${x},${y})` };
            }
        } else {
            consecutiveStuck = 0;
        }

        lastPos = currentPos;
        await releaseEventLoop();
    }

    return { success: true, message: `arrived at (${x},${y})` };
}

export async function pick_up_parcel(agent) {
    const ok = await agent.io.doPickup();
    if (ok) await releaseEventLoop();
    return ok
        ? { success: true, message: 'parcel picked up' }
        : { success: false, message: 'no parcel to pick up here' };
}

export async function put_down_parcel(agent) {
    const ok = await agent.io.doPutdown();
    if (ok) await releaseEventLoop();
    return ok
        ? { success: true, message: 'parcel(s) put down' }
        : { success: false, message: 'could not put down here' };
}

export async function find_and_get_a_parcel(agent) {
    const MAX_ATTEMPTS = 1;

    const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    // `freeParcels()` is assumed to return parcels currently in the agent's view.
    // No distance filter: choose the closest visible parcel, wherever it is.
    const nearestVisibleParcel = () => {
        const me = agent.world.me;

        return agent.world.freeParcels()
            .sort((a, b) => distance(me, a) - distance(me, b))[0];
    };

    const collectParcel = async (parcel) => {
        const moved = await move_to(agent, { x: parcel.x, y: parcel.y });
        return moved.success ? pick_up_parcel(agent) : moved;
    };

    const collectVisibleParcel = async () => {
        const parcel = nearestVisibleParcel();
        return parcel ? collectParcel(parcel) : null;
    };

    // Travel toward a spawner. After every step, divert to the closest
    // currently visible parcel and return as soon as it is picked up.
    const moveToSpawnerOrCollectParcel = async (target) => {
        while (!agent.world.isAt(target)) {
            const parcel = nearestVisibleParcel();

            if (parcel) {
                return collectParcel(parcel);
            }

            const moved = await stepToward(agent, target);
            if (!moved) {
                return {
                    success: false,
                    message: `blocked or no path to spawner (${target.x},${target.y})`,
                };
            }

            await releaseEventLoop();
        }

        // One final visibility check after reaching the spawner.
        return collectVisibleParcel();
    };

    // Immediately collect the closest parcel already in view.
    const initialResult = await collectVisibleParcel();
    if (initialResult) return initialResult;

    const availableSpawners = [...(agent.world.map?.spawnerTiles ?? [])];
    if (availableSpawners.length === 0) {
        return { success: false, message: 'no visible parcels and no spawner tiles known' };
    }

    const visited = [];

    for (
        let attempt = 0;
        attempt < MAX_ATTEMPTS && availableSpawners.length > 0;
        attempt++
    ) {
        const me = agent.world.me;

        // Select separated destinations to cover a wider part of the map.
        const score = (tile) =>
            distance(me, tile) +
            visited.reduce((total, previous) => total + distance(tile, previous), 0);

        availableSpawners.sort((a, b) => score(b) - score(a));

        const target = availableSpawners.shift();
        const result = await moveToSpawnerOrCollectParcel(target);

        // Parcel found and picked up — end immediately.
        if (result?.success) return result;

        visited.push(target);
        await releaseEventLoop(100);
    }

    return {
        success: false,
        message: `searched ${visited.length} separated spawner tile(s); no visible parcel found`,
    };
}

export function calculator(_agent, args = {}) {
    const { expression } = args;
    if (typeof expression !== 'string' || !/^[0-9+\-*/().\s]+$/.test(expression)) {
        return { success: false, message: 'invalid characters in expression' };
    }
    try {
        // eslint-disable-next-line no-new-func
        const value = Function(`"use strict"; return (${expression});`)();
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return { success: false, message: 'expression did not evaluate to a finite number' };
        }
        return { success: true, message: String(value) };
    } catch (e) {
        return { success: false, message: `invalid expression: ${e.message}` };
    }
}

export function add_to_memory(_agent, args = {}) {
    const { text } = args;
    if (typeof text !== 'string' || text.trim().length === 0) {
        return { success: false, message: 'empty memory text' };
    }
    try {
        appendFileSync(MEMORY_FILE, `- ${text.trim()}\n`, 'utf-8');
        return { success: true, message: `memory saved: "${text.trim()}"` };
    } catch (e) {
        return { success: false, message: `could not write memory: ${e.message}` };
    }
}

// ── NPC tools (agent4, via MCP) — signature: (agent, args) ───────────────────

export async function agent_move_to(_agent, args = {}) {
    return callAgent4Tool('goto_agent', { x: args.x, y: args.y });
}

export async function agent_pick_up_parcel() {
    return callAgent4Tool('pickup_agent');
}

export async function agent_put_down_parcel() {
    return callAgent4Tool('putdown_agent');
}

export async function agent_find_and_get_a_parcel() {
    return callAgent4Tool('find_and_get_parcel_agent');
}

// Fetches agent4's current state (position, carrying count, visible parcels)
// and caches it on `agent.agent4State` so evaluateCondition (sync) can read it.
export async function agent_get_state(agent) {
    const result = await callAgent4Tool('get_agent_state');
    if (result.success !== false && result.raw) {
        agent.agent4State = {
            carrying: result.raw.carrying ?? 0,
            parcelsVisible: result.raw.parcelsVisible ?? 0,
            position: result.raw.position,
            score: result.raw.score,
        };
        return { success: true, message: `agent4 state refreshed: carrying=${agent.agent4State.carrying}, parcelsVisible=${agent.agent4State.parcelsVisible}` };
    }
    return { success: false, message: result.message ?? 'failed to fetch agent4 state' };
}

// ── Registry used by parser.js (plan execution) ──────────────────────────────
// Usage: await TOOL_FNS[step.tool](agent, step.args ?? {})

export const TOOL_FNS = {
    move_to,
    pick_up_parcel,
    put_down_parcel,
    find_and_get_a_parcel,
    calculator,
    add_to_memory,
    agent_move_to,
    agent_pick_up_parcel,
    agent_put_down_parcel,
    agent_find_and_get_a_parcel,
    agent_get_state,
    reply_to_server,
};

// List of condition names that require a fresh agent4 state before evaluation.
// parser.js should call agent_get_state(agent) before evaluating conditions
// whose name is in this set.
export const AGENT4_CONDITIONS = new Set([
    'agent_carrying_less_than',
    'agent_carrying_at_least',
    'agent_free_parcels_exist',
]);

// ── Condition evaluator (used by parser.js for if/loop) ──────────────────────
// Usage: evaluateCondition(agent, { condition: "carrying_at_least", args: { n: 1 } })
// NOTE: this stays synchronous. For agent_* conditions it reads the cached
// `agent.agent4State`, which parser.js must refresh via agent_get_state(agent)
// before calling evaluateConditions() whenever the condition list contains
// any name from AGENT4_CONDITIONS.

export async function reply_to_server(agent, { msg } = {}) {
    if (typeof msg !== 'string') {
        return {
            success: false,
            message: 'reply_to_server richiede args.msg come stringa',
        };
    }

    try {
        // Sostituisci questa chiamata con il tuo metodo reale di invio al server.
        //await agent.sendReply(msg);
        console.log(`[${agent.name}][reply_to_server] ${msg}`);

        return {
            success: true,
            message: 'reply inviata al server',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : String(error),
        };
    }
}
export function evaluateCondition(agent, condition) {
    const { condition: name, args = {} } = condition;
    switch (name) {
        case 'carrying_less_than':
            return agent.world.carrying().length < args.n;
        case 'carrying_at_least':
            return agent.world.carrying().length >= args.n;
        case 'free_parcels_exist':
            return agent.world.freeParcels().length > 0;
        case 'at_delivery_tile':
            return agent.world.atDelivery();
        case 'agent_carrying_less_than':
            return (agent.agent4State?.carrying ?? 0) < args.n;
        case 'agent_carrying_at_least':
            return (agent.agent4State?.carrying ?? 0) >= args.n;
        case 'agent_free_parcels_exist':
            return (agent.agent4State?.parcelsVisible ?? 0) > 0;
        default:
            console.warn(`[tools] unknown condition: ${name}`);
            return false;
    }
}