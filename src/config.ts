//TODO handle multiple config values for multi-agent scenarios
type AgentConfig = {
    host: string;
    token: string;

    maxAgentHistoryPositions: number;
    enableTerminalUI: boolean;
    showHeatMapInUI: boolean;
    showGridMapInUI: boolean

    backstopTimerMs: number;
    pddlSolverMaxTimeS: number;
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const agentConfig: AgentConfig = {
    host: requireEnv('HOST'),
    token: requireEnv('TOKEN'),

    maxAgentHistoryPositions: process.env.MAX_AGENT_HISTORY_POSITIONS ? parseInt(process.env.MAX_AGENT_HISTORY_POSITIONS) : 1,

    enableTerminalUI: process.env.ENABLE_TERMINAL_UI === "true",
    showGridMapInUI: process.env.SHOW_GRID_MAP_IN_UI === "true",
    showHeatMapInUI: process.env.SHOW_HEATMAP_IN_UI === "true",
    pddlSolverMaxTimeS: process.env.PDDL_PATHFINDIG_MAX_SOLVING_TIME_S ? parseInt(process.env.PDDL_PATHFINDIG_MAX_SOLVING_TIME_S) : 15,

    backstopTimerMs: process.env.DESIRES_GENERATION_BACKSTOP_TIMER_MS ? parseInt(process.env.DESIRES_GENERATION_BACKSTOP_TIMER_MS) : 1000,
}

export {
    agentConfig,
    AgentConfig,
}