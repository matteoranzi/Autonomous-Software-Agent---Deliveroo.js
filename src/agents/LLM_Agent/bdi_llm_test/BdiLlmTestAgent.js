// src/agents/bdi_llm_test/BdiLlmTestAgent.js
import { DjsConnect } from '@unitn-asa/deliveroo-js-sdk/client';
import express from 'express';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const MCP_PORT = Number(process.env.AGENT4_MCP_PORT ?? 3001);

export class BdiLlmTestAgent {
    constructor({ name, host, dashboardUrl, spawnerTiles = [] }) {
        this.name = name;
        this.host = host;
        this.dashboardUrl = dashboardUrl;

        this.socket = null;
        this.map = null;
        this.me = null;
        this.parcels = [];
        this.agents = [];
        this.carriedCount = 0;

        // Supply actual spawner coordinates here when constructing the agent:
        // [{ x: 3, y: 8 }, { x: 17, y: 11 }]
        this.spawnerTiles = spawnerTiles;

        this.httpServer = null;
    }

    async setup(token) {
        this.socket = DjsConnect(this.host, token);

        const mapReady = new Promise((res) => {
            this.socket.onMap((width, height, tiles) => {
                this.map = { width, height, tiles };
                console.log(`[${this.name}] map: ${width}x${height}`);
                res();
            });
        });

        const youReady = new Promise((res) => {
            this.socket.onYou((you) => {
                this.me = you;
                res();
            });
        });

        if (typeof this.socket.onParcelsSensing === 'function') {
            this.socket.onParcelsSensing((parcels) => {
                this.parcels = parcels;
            });
        } else if (typeof this.socket.onSensing === 'function') {
            this.socket.onSensing((sensing) => {
                this.parcels = sensing?.parcels ?? [];
                this.agents = sensing?.agents ?? this.agents;
            });
        }

        if (typeof this.socket.onAgentsSensing === 'function') {
            this.socket.onAgentsSensing((agents) => {
                this.agents = agents;
            });
        }

        await Promise.all([mapReady, youReady]);
        console.log(`🤖 [${this.name}] connected as ${this.me?.name ?? this.me?.id}`);

        await this.startMcpServer(MCP_PORT);
    }

    // ── Pathfinding: BFS sulla propria mappa → lista di direzioni ────────────

    findPath(goal) {
        if (!this.map || !this.me) return null;

        const walkable = new Set(
            this.map.tiles
                .filter((t) => t.type !== 0 && !t.locked)
                .map((t) => `${t.x},${t.y}`),
        );

        if (!walkable.has(`${goal.x},${goal.y}`)) return null;

        const start = {
            x: Math.round(this.me.x),
            y: Math.round(this.me.y),
        };

        if (start.x === goal.x && start.y === goal.y) return [];

        const key = (x, y) => `${x},${y}`;
        const cameFrom = new Map();
        const visited = new Set([key(start.x, start.y)]);
        let frontier = [start];

        const deltas = [
            [0, 1, 'up'],
            [0, -1, 'down'],
            [1, 0, 'right'],
            [-1, 0, 'left'],
        ];

        while (frontier.length) {
            const next = [];

            for (const cur of frontier) {
                for (const [dx, dy, dir] of deltas) {
                    const nx = cur.x + dx;
                    const ny = cur.y + dy;
                    const k = key(nx, ny);

                    if (visited.has(k) || !walkable.has(k)) continue;

                    visited.add(k);
                    cameFrom.set(k, {
                        from: key(cur.x, cur.y),
                        dir,
                    });

                    if (nx === goal.x && ny === goal.y) {
                        const dirs = [];
                        let currentKey = k;

                        while (cameFrom.has(currentKey)) {
                            const { from, dir: direction } = cameFrom.get(currentKey);
                            dirs.unshift(direction);
                            currentKey = from;
                        }

                        return dirs;
                    }

                    next.push({ x: nx, y: ny });
                }
            }

            frontier = next;
        }

        return null;
    }

    distance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    currentPosition() {
        return {
            x: Math.round(this.me?.x ?? 0),
            y: Math.round(this.me?.y ?? 0),
        };
    }

    isAt(target) {
        const me = this.currentPosition();
        return me.x === target.x && me.y === target.y;
    }

    // Trova il parcel libero più vicino tra quelli attualmente visibili.
    nearestFreeParcel() {
        if (!this.me || !this.parcels.length) return null;

        const free = this.parcels.filter((parcel) => !parcel.carriedBy);
        if (!free.length) return null;

        const me = this.currentPosition();

        return free.sort(
            (a, b) => this.distance(me, a) - this.distance(me, b),
        )[0];
    }

    // Spawner reali, se configurati. Se non sono disponibili, usa tile
    // walkable lontani come punti di esplorazione per non fermare l'agente.
    explorationTargets() {
        if (this.spawnerTiles.length > 0) {
            return [...this.spawnerTiles];
        }

        return (this.map?.tiles ?? [])
            .filter((tile) => tile.type !== 0 && !tile.locked)
            .map((tile) => ({ x: tile.x, y: tile.y }));
    }

    async waitForStateUpdate(ms = 50) {
        await new Promise((resolve) => setTimeout(resolve, ms));
    }

    // ── MCP server: espone i comandi di questo agente come tool ──────────────

    buildMcpServer() {
        const text = (obj) => ({
            content: [{ type: 'text', text: JSON.stringify(obj) }],
        });

        const pos = () => ({
            x: this.me?.x,
            y: this.me?.y,
        });

        const server = new McpServer({
            name: 'agent4',
            version: '1.0.0',
        });

        server.tool(
            'move_agent',
            'Move Agent4 one step in a direction: up/down/left/right. Optionally repeat n times.',
            {
                direction: z.enum(['up', 'down', 'left', 'right']),
                n: z.number().int().min(1).max(20).optional(),
            },
            async ({ direction, n = 1 }) => {
                for (let i = 0; i < n; i++) {
                    const ok = await this.socket.emitMove(direction);

                    if (!ok) {
                        return text({
                            success: false,
                            message: `move ${direction} failed at step ${i + 1} (blocked?)`,
                            position: pos(),
                        });
                    }

                    await this.waitForStateUpdate();
                }

                return text({
                    success: true,
                    message: `moved ${direction} x${n}`,
                    position: pos(),
                });
            },
        );

        server.tool(
            'goto_agent',
            'Move Agent4 to coordinates (x,y) using pathfinding.',
            {
                x: z.number().int(),
                y: z.number().int(),
            },
            async ({ x, y }) => {
                const dirs = this.findPath({ x, y });

                if (!dirs) {
                    return text({
                        success: false,
                        message: `no path to (${x},${y}) or tile not walkable`,
                        position: pos(),
                    });
                }

                for (const dir of dirs) {
                    const ok = await this.socket.emitMove(dir);

                    if (!ok) {
                        return text({
                            success: false,
                            message: `move ${dir} failed en route to (${x},${y})`,
                            position: pos(),
                        });
                    }

                    await this.waitForStateUpdate();
                }

                return text({
                    success: true,
                    message: `arrived at (${x},${y})`,
                    position: pos(),
                });
            },
        );

        server.tool(
            'pickup_agent',
            'Agent4 picks up the parcel on its current tile.',
            {},
            async () => {
                const result = await this.socket.emitPickup();
                const ok = Boolean(result && (Array.isArray(result) ? result.length : true));

                if (ok) this.carriedCount += 1;

                return text({
                    success: ok,
                    message: ok ? 'parcel picked up' : 'no parcel to pick up here',
                    position: pos(),
                });
            },
        );

        server.tool(
            'putdown_agent',
            'Agent4 puts down all carried parcels on its current tile.',
            {},
            async () => {
                const result = await this.socket.emitPutdown();
                const ok = Boolean(result);

                if (ok) this.carriedCount = 0;

                return text({
                    success: ok,
                    message: ok ? 'parcel(s) put down' : 'could not put down here',
                    position: pos(),
                });
            },
        );

        server.tool(
        'find_and_get_parcel_agent',
        'Agent4 picks up the nearest visible free parcel. If none is visible, it explores one distant target and immediately diverts when a parcel appears.',
        {},
        async () => {
            const MAX_STEPS = 100;

            const sameParcel = (a, b) => {
                if (!a || !b) return false;

                // Prefer the parcel id when it exists; otherwise compare position.
                if (a.id != null && b.id != null) return a.id === b.id;

                return a.x === b.x && a.y === b.y;
            };

            const isStillFreeAndVisible = (target) =>
                this.parcels.some(
                    (parcel) => !parcel.carriedBy && sameParcel(parcel, target),
                );

            const pauseForWorldUpdate = async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
            };

            const pickupCurrentTile = async (parcel) => {
                // The parcel may have expired or been collected after the last move.
                if (!isStillFreeAndVisible(parcel)) {
                    return {
                        success: false,
                        message: 'target parcel disappeared before pickup',
                    };
                }

                const result = await this.socket.emitPickup();
                const picked = Boolean(
                    result && (Array.isArray(result) ? result.length : true),
                );

                if (picked) this.carriedCount += 1;

                return {
                    success: picked,
                    message: picked
                        ? `picked up parcel ${parcel.id ?? 'at current position'}`
                        : 'pickup failed: parcel was no longer available',
                };
            };

            // Moves only one step, then the caller can re-read sensed parcel state.
            const moveOneStepToward = async (target) => {
                const dirs = this.findPath({ x: target.x, y: target.y });

                if (!dirs || dirs.length === 0) {
                    return {
                        success: false,
                        message: `no path to (${target.x},${target.y})`,
                    };
                }

                const ok = await this.socket.emitMove(dirs[0]);

                if (!ok) {
                    return {
                        success: false,
                        message: `blocked moving toward (${target.x},${target.y})`,
                    };
                }

                await pauseForWorldUpdate();

                return { success: true };
            };

            // Continually reacquires the nearest parcel. If a target expires,
            // the next iteration naturally chooses another currently visible one.
            const collectVisibleParcel = async () => {
                for (let step = 0; step < MAX_STEPS; step++) {
                    const target = this.nearestFreeParcel();

                    if (!target) {
                        return {
                            success: false,
                            message: 'no free parcels visible',
                        };
                    }

                    if (this.isAt(target)) {
                        const pickupResult = await pickupCurrentTile(target);

                        // If this parcel vanished, retry using any newly visible parcel.
                        if (!pickupResult.success && this.nearestFreeParcel()) {
                            continue;
                        }

                        return pickupResult;
                    }

                    const moveResult = await moveOneStepToward(target);

                    if (!moveResult.success) {
                        // The path may be stale or another agent may now block it.
                        // Retry next iteration with the latest sensed state.
                        if (this.nearestFreeParcel()) continue;

                        return moveResult;
                    }
                }

                return {
                    success: false,
                    message: `parcel search exceeded ${MAX_STEPS} movement steps`,
                };
            };

            // 1. Collect immediately if any parcel is visible.
            if (this.nearestFreeParcel()) {
                const result = await collectVisibleParcel();

                return text({
                    ...result,
                    position: pos(),
                });
            }

            // 2. Nothing visible: select the farthest reachable exploration tile.
            // Use this.spawnerTiles if you have populated it with real spawner coords;
            // otherwise this falls back to all walkable map tiles.
            const me = this.currentPosition();

            const targets = this.spawnerTiles.length > 0
                ? this.spawnerTiles
                : (this.map?.tiles ?? [])
                    .filter((tile) => tile.type !== 0 && !tile.locked)
                    .map((tile) => ({ x: tile.x, y: tile.y }));

            const explorationTarget = [...targets]
                .filter((tile) => this.findPath({ x: tile.x, y: tile.y }) !== null)
                .sort(
                    (a, b) =>
                        this.distance(me, b) - this.distance(me, a),
                )[0];

            if (!explorationTarget) {
                return text({
                    success: false,
                    message: 'no visible parcels and no reachable exploration target',
                    position: pos(),
                });
            }

            // 3. Walk toward the exploration target, checking for parcels after
            // every step. The first visible parcel interrupts exploration.
            for (let step = 0; step < MAX_STEPS; step++) {
                if (this.nearestFreeParcel()) {
                    const result = await collectVisibleParcel();

                    return text({
                        ...result,
                        position: pos(),
                    });
                }

                if (this.isAt(explorationTarget)) break;

                const moveResult = await moveOneStepToward(explorationTarget);

                if (!moveResult.success) {
                    return text({
                        ...moveResult,
                        position: pos(),
                    });
                }
            }

            // Final check after reaching the exploration target.
            if (this.nearestFreeParcel()) {
                const result = await collectVisibleParcel();

                return text({
                    ...result,
                    position: pos(),
                });
            }

            return text({
                success: false,
                message: `explored (${explorationTarget.x},${explorationTarget.y}); no free parcel visible`,
                position: pos(),
            });
        },
    );

        server.tool(
            'get_agent_state',
            'Get Agent4 current position, parcels carried, and nearby parcels/agents.',
            {},
            async () => text({
                position: pos(),
                score: this.me?.score,
                carrying: this.carriedCount,
                parcelsVisible: this.parcels.filter((parcel) => !parcel.carriedBy).length,
                agentsVisible: this.agents.length,
            }),
        );

        return server;
    }

    async startMcpServer(port) {
        const app = express();
        app.use(express.json());

        app.post('/mcp', async (req, res) => {
            try {
                const server = this.buildMcpServer();
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined,
                });

                res.on('close', () => {
                    transport.close();
                    server.close();
                });

                await server.connect(transport);
                await transport.handleRequest(req, res, req.body);
            } catch (e) {
                console.error(`[${this.name}] MCP request error:`, e.message);

                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: e.message,
                        },
                        id: null,
                    });
                }
            }
        });

        const notAllowed = (_req, res) => res.status(405).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.',
            },
            id: null,
        });

        app.get('/mcp', notAllowed);
        app.delete('/mcp', notAllowed);

        await new Promise((res) => {
            this.httpServer = app.listen(port, () => {
                console.log(
                    `🔌 [${this.name}] MCP server on http://localhost:${port}/mcp`,
                );
                res();
            });
        });
    }

    async loop() {
        // Idle: this agent only acts when commanded via MCP tools.
    }
}