// llmClient.js
// LLM client using the OpenAI-compatible API, pointed at a LiteLLM proxy (local Ollama backend or
// a remote provider, per LLM_TARGET) instead of talking to Ollama's native API directly.
import OpenAI from 'openai';
import { getLLMConfig } from './llm-config.js';

const { baseURL, apiKey, model } = getLLMConfig();

export const LLM_CONTEXT_WINDOW = Number(process.env.LLM_CONTEXT_WINDOW ?? 32768);
export const LLM_TEMPERATURE = Number(process.env.LLM_TEMPERATURE ?? 0.9);

const client = new OpenAI({ baseURL, apiKey });

/**
 * Verifies the LiteLLM proxy is reachable via its health endpoint.
 * Useful to call at startup for a fail-fast check.
 *
 * @returns {Promise<boolean>}
 */
export async function checkLLMReachable() {
    console.debug(`[llm] Checking reachability at ${baseURL} ...`);
    try {
        const res = await fetch(`${baseURL}/health/liveliness`);
        console.debug(`[llm] /health/liveliness responded with status ${res.status}`);

        if (!res.ok) {
            console.error(`[llm] Server reachable but returned an error status: ${res.status}`);
            return false;
        }

        console.debug(`[llm] Reachable. Configured model: ${model}`);
        return true;
    } catch (err) {
        console.error(`[llm] Not reachable at ${baseURL}: ${err.message}`);
        return false;
    }
}

/**
 * Sends a prompt to the configured LLM (via LiteLLM) and returns the model's reply.
 * The model is expected to respond with a JSON string (in message.content)
 * shaped as { plan: [...], chat: "..." } — parsed downstream by parser.js.
 *
 * @param {string} text
 * @returns {Promise<{ message: object, promptTokens: number, replyTokens: number }>}
 */
export async function queryLLM(text) {
    console.debug(`[llm] Sending request to ${baseURL} (model: ${model})`);
    console.debug(`[llm] context_window: ${LLM_CONTEXT_WINDOW}, temperature: ${LLM_TEMPERATURE}`);
    console.debug(`[llm] Prompt (first 200 chars): ${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`);

    const startTime = Date.now();

    let response;
    try {
        response = await client.chat.completions.create({
            model,
            messages: [{ role: 'user', content: text }],
            temperature: LLM_TEMPERATURE,
            response_format: { type: 'json_object' },
        });
    } catch (err) {
        console.error(`[llm] Request failed: ${err.message}`);
        throw new Error(`LLM request failed: ${err.message}`);
    }

    const elapsed = Date.now() - startTime;
    console.debug(`[llm] Response received in ${elapsed}ms`);

    const message = response.choices?.[0]?.message ?? { role: 'assistant', content: '' };
    const promptTokens = response.usage?.prompt_tokens ?? 0;
    const replyTokens = response.usage?.completion_tokens ?? 0;

    console.debug(`[llm] promptTokens=${promptTokens}, replyTokens=${replyTokens}`);
    console.debug(`[llm] Reply content (first 300 chars): ${(message.content ?? '').slice(0, 300)}`);

    return { message, promptTokens, replyTokens };
}
