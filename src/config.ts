//TODO handle multiple config values for multi-agent scenarios
type AppConfig = {
    host: string;
    token: string;

    maxAgentHistoryPositions: number;
    showHeatMapInUI: boolean;
    enableTerminalUI: boolean;
}

const config: AppConfig = {
    host: process.env.HOST,
    token: process.env.TOKEN,

    maxAgentHistoryPositions: process.env.MAX_AGENT_HISTORY_POSITIONS ? parseInt(process.env.MAX_AGENT_HISTORY_POSITIONS) : 1,

    enableTerminalUI: process.env.ENABLE_TERMINAL_UI === "true",
    showHeatMapInUI: process.env.SHOW_HEATMAP_IN_UI === "true",
}

export {
    config,
    AppConfig,
}