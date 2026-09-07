import { getLLMConfig } from "@/llm/llm-config";

export async function checkLiteLLM(): Promise<void> {
    const { baseURL } = getLLMConfig();
    const res = await fetch(`${baseURL}/health/liveliness`);
    if (!res.ok) throw new Error(`LiteLLM unreachable at ${baseURL} (${res.status})`);
}

async function resolveProviderModel(baseURL: string, apiKey: string, alias: string): Promise<string> {
    const res = await fetch(`${baseURL}/models`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Could not fetch model list (${res.status})`);
    const data = await res.json();
    const match = data.data?.find((m: any) => m.id === alias);
    if (!match) throw new Error(`Alias "${alias}" not found in LiteLLM model list`);
    return match.litellm_params?.model ?? alias;
}

async function testConnectionViaHealthEndpoint(baseURL: string, apiKey: string, providerModel: string): Promise<void> {
    const res = await fetch(`${baseURL}/health/test_connection`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            litellm_params: { model: providerModel },
            mode: "chat",
        }),
    });
    if (res.status === 403) throw new Error("FORBIDDEN");
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const detail = data?.error?.message ?? data?.detail ?? data?.message ?? JSON.stringify(data);
        throw new Error(`connection failed (${res.status}): ${detail}`);
    }
    if (data?.error) throw new Error(`unreachable: ${data.error}`);
}

async function testConnectionViaCompletion(baseURL: string, apiKey: string, alias: string): Promise<void> {
    const res = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: alias,
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 1,
        }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const detail = data?.error?.message ?? data?.detail ?? data?.message ?? JSON.stringify(data);
        throw new Error(`connection failed (${res.status}): ${detail}`);
    }
}

async function testConnection(baseURL: string, apiKey: string, alias: string, providerModel: string): Promise<void> {
    try {
        await testConnectionViaHealthEndpoint(baseURL, apiKey, providerModel);
    } catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            await testConnectionViaCompletion(baseURL, apiKey, alias);
        } else {
            throw err;
        }
    }
}

async function buildModelChecks(aliases: string[], baseURL: string, apiKey: string): Promise<Array<[string, () => Promise<void>]>> {
    return Promise.all(
        aliases.map(async (alias) => {
            const providerModel = await resolveProviderModel(baseURL, apiKey, alias).catch(() => alias);
            return [alias, () => testConnection(baseURL, apiKey, alias, providerModel)] as [string, () => Promise<void>];
        })
    );
}

export async function expandLLMModels(): Promise<Array<[string, () => Promise<void>]>> {
    const { baseURL, apiKey } = getLLMConfig();
    const res = await fetch(`${baseURL}/models`, { headers: { "Authorization": `Bearer ${apiKey}` } });
    if (!res.ok) throw new Error(`Could not fetch model list (${res.status})`);
    const data = await res.json();
    const aliases: string[] = data.data?.map((m: any) => m.id) ?? [];
    if (aliases.length === 0) throw new Error("No models registered in LiteLLM");
    return buildModelChecks(aliases, baseURL, apiKey);
}

export async function expandEnvModel(): Promise<Array<[string, () => Promise<void>]>> {
    const { baseURL, apiKey, model: alias } = getLLMConfig();
    return buildModelChecks([alias], baseURL, apiKey);
}

export function validateEnvModel(passed: Set<string>, _failed: Set<string>): void {
    const { model: envAlias } = getLLMConfig();
    if (passed.has(envAlias)) return;

    const alternatives = [...passed].filter(a => a !== envAlias);
    if (alternatives.length > 0) {
        throw new Error(
            `"${envAlias}" is unreachable. Available alternatives: ${alternatives.join(", ")}`
        );
    }
    throw new Error(`"${envAlias}" is unreachable and no alternative models are available`);
}
