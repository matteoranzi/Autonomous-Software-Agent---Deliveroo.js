// ollama.js
// Minimal client for a local Ollama instance (http://172.27.96.1:11434).

const OLLAMA_URL   = process.env.LOCAL_BASE_URL   ?? 'http://localhost:4000';
const OLLAMA_MODEL = process.env.LOCAL_MODEL ?? 'gemma4:26b';
export const OLLAMA_NUM_CTX = Number(process.env.OLLAMA_NUM_CTX ?? 32768);
export const OLLAMA_TEMPERATURE = Number(process.env.OLLAMA_TEMPERATURE ?? 0.9);

/**
 * Verifica che il server Ollama sia raggiungibile, interrogando /api/tags.
 * Utile da chiamare all'avvio dell'app per fail-fast se Ollama non è su.
 *
 * @returns {Promise<boolean>}
 */
export async function checkOllamaReachable() {
    console.debug(`[ollama] Checking reachability at ${OLLAMA_URL} ...`);
    try {
        const res = await fetch(`${OLLAMA_URL}/api/tags`);
        console.debug(`[ollama] /api/tags responded with status ${res.status}`);

        if (!res.ok) {
            console.error(`[ollama] Server reachable but returned an error status: ${res.status}`);
            return false;
        }

        const data = await res.json();
        const models = (data.models ?? []).map(m => m.name);
        console.debug(`[ollama] Reachable. Available models: ${models.join(', ') || '(none)'}`);

        if (!models.includes(OLLAMA_MODEL)) {
            console.warn(`[ollama] WARNING: configured model "${OLLAMA_MODEL}" not found among available models.`);
        }

        return true;
    } catch (err) {
        console.error(`[ollama] Not reachable at ${OLLAMA_URL}: ${err.message}`);
        return false;
    }
}

/**
 * Sends a prompt to the local Ollama server and returns the model's reply.
 * The model is expected to respond with a JSON string (in message.content)
 * shaped as { plan: [...], chat: "..." } — parsed downstream by parser.js.
 *
 * @param {string} text
 * @returns {Promise<{ message: object, promptTokens: number, replyTokens: number }>}
 */
export async function queryOllama(text) {
    console.debug(`[ollama] Sending request to ${OLLAMA_URL}/api/chat`);
    console.debug(`[ollama] Model: ${OLLAMA_MODEL}, num_ctx: ${OLLAMA_NUM_CTX}, temperature: ${OLLAMA_TEMPERATURE}`);
    console.debug(`[ollama] Prompt (first 200 chars): ${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`);

    const startTime = Date.now();

    let res;
    try {
        res = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [{ role: 'user', content: text }],
                format: 'json',
                stream: false,
                options: {
                    num_ctx: OLLAMA_NUM_CTX,
                    temperature: OLLAMA_TEMPERATURE,
                },
            }),
        });
    } catch (err) {
        console.error(`[ollama] Network error while contacting ${OLLAMA_URL}: ${err.message}`);
        throw new Error(`Ollama unreachable at ${OLLAMA_URL}: ${err.message}`);
    }

    const elapsed = Date.now() - startTime;
    console.debug(`[ollama] Response received in ${elapsed}ms with status ${res.status}`);

    if (!res.ok) {
        const errText = await res.text();
        console.error(`[ollama] Request failed (${res.status}): ${errText}`);
        throw new Error(`Ollama request failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    console.debug(`[ollama] promptTokens=${data.prompt_eval_count ?? 0}, replyTokens=${data.eval_count ?? 0}`);
    console.debug(`[ollama] Reply content (first 300 chars): ${(data.message?.content ?? '').slice(0, 300)}`);

    return {
        message: data.message ?? { role: 'assistant', content: '' },
        promptTokens: data.prompt_eval_count ?? 0,
        replyTokens: data.eval_count ?? 0,
    };
}