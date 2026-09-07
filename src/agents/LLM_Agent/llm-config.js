// llm-config.js
// Plain-JS port of src/agents/_misc/llm-config.ts's getLLMConfig(), for LLM_Agent - a standalone
// ESM entrypoint outside the TS build, so it self-loads dotenv rather than relying on main.ts's.
import 'dotenv/config';

function requireEnv(key) {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required env var: ${key}`);
    return value;
}

export function getLLMConfig() {
    const target = process.env.LLM_TARGET ?? 'local';

    if (target === 'local') {
        return {
            target,
            baseURL: requireEnv('LOCAL_BASE_URL'),
            apiKey: requireEnv('LOCAL_API_KEY'),
            model: requireEnv('LOCAL_MODEL'),
        };
    }

    if (target === 'remote') {
        return {
            target,
            baseURL: requireEnv('REMOTE_BASE_URL'),
            apiKey: requireEnv('REMOTE_API_KEY'),
            model: requireEnv('REMOTE_MODEL'),
        };
    }

    throw new Error(`Unknown LLM_TARGET: "${target}" (expected "local" or "remote")`);
}
