import {getLLMConfig} from "@/llm/llm-config";

export function printRunConfig(): void {
    const { target, baseURL, model } = getLLMConfig();
    console.log("\x1b[45m\t\t\t\t\t\x1b[0m");
    console.log(" \x1b[35m\x1b[1mRun configuration\x1b[0m");
    console.log(`  LiteLLM Target  : ${target}`);
    console.log(`  Base URL: ${baseURL}`);
    console.log(`  Model   : ${model}`);
    console.log("\x1b[45m\t\t\t\t\t\x1b[0m\n");
}