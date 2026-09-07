import OpenAI from 'openai'
import {getLLMConfig} from "@/agents/_misc/llm-config";
import {runPreflight} from "@/agents/_misc/preflight";
import {printRunConfig} from "@/agents/_misc/startup";

// import {main as mcpClient} from "@/exercises/fastmcp/client";

async function main() {
    await runPreflight();
    printRunConfig();

    console.log("Running...");
    // await mcpClient();
}

main().then(r => console.log("\n\n\x1b[4mExecution completed successfully.\x1b[0m")).catch(e => console.error(e));