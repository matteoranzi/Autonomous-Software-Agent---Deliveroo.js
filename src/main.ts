import 'dotenv/config'
import {agentConfig} from './config'
import readline from 'readline';

import {BDI_Agent} from "@/agents/BDI_Agent/BDI_Agent";



main().then(() => console.log("Application started")).catch(err => {
    console.error("Error starting the Application:", err);
});

async function main() {
    let bdi_agent: BDI_Agent = new BDI_Agent(agentConfig);

    let ready = bdi_agent.start();

    ready.then(() => {
        console.log("BDI Agent is ready");

        // *** TERMINAL UI ***
        if(agentConfig.enableTerminalUI) {
            setupTerminalUI(bdi_agent);
        }
    });
}

//====================================================
//  Terminal UI
//====================================================

function setupTerminalUI(bdi_agent: BDI_Agent) {
    process.stdout.write('\x1b[?1049h\x1b[?25l');
    setInterval(async () => {
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
        process.stdout.write(await bdi_agent.toString());
    }, 50);
}

function restoreTerminal(): void {
    process.stdout.write('\x1b[?25h\x1b[?1049l');
}
process.on('exit', restoreTerminal);
process.on('SIGINT', () => process.exit());

