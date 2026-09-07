import OpenAI from 'openai'
import {getLLMConfig} from "@/agents/LLM_Agent//llm-config";
import {runPreflight} from "@/agents/LLM_Agent/preflight";
import {printRunConfig} from "@/agents/LLM_Agent/startup";

// import {main as mcpClient} from "@/exercises/fastmcp/client";

async function main() {
    await runPreflight();
    printRunConfig();

    console.log("Running...");
    // await mcpClient();
}

main().then(r => console.log("\n\n\x1b[4mExecution completed successfully.\x1b[0m")).catch(e => console.error(e));