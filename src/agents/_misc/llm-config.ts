// llm-config.ts
import "dotenv/config";

type LLMTarget = "local" | "remote";

interface LLMConfig {
    baseURL: string;
    apiKey: string;
    model: string;
    target: LLMTarget;
}

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required env var: ${key}`);
    }
    return value;
}

export function getLLMConfig(): LLMConfig {
    const target = (process.env.LLM_TARGET as LLMTarget) ?? "local";

    if (target === "local") {
        return {
            target,
            baseURL: requireEnv("LOCAL_BASE_URL"),
            apiKey: requireEnv("LOCAL_API_KEY"),
            model: requireEnv("LOCAL_MODEL"),
        };
    }

    if (target === "remote") {
        return {
            target,
            baseURL: requireEnv("REMOTE_BASE_URL"),
            apiKey: requireEnv("REMOTE_API_KEY"),
            model: requireEnv("REMOTE_MODEL"),
        };
    }

    throw new Error(`Unknown LLM_TARGET: "${target}" (expected "local" or "remote")`);
}