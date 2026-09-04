import 'dotenv/config'
import {config} from './config'
import readline from 'readline';

import { DjsConnect } from "@matteoranzi/deliveroo-js-sdk/client";
import {BDI_Agent} from "@/agents/BDI_Agent/BDI_Agent";


main();

function main() {
    let bdi_agent: BDI_Agent = new BDI_Agent(DjsConnect(config.host, config.token), config);

    // // *** TERMINAL UI ***
    process.stdout.write('\x1b[?1049h\x1b[?25l');
    setInterval(() => {
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
        process.stdout.write(bdi_agent.toString());
    }, 50);
}

//====================================================

function restoreTerminal(): void {
    process.stdout.write('\x1b[?25h\x1b[?1049l');
}
process.on('exit', restoreTerminal);
process.on('SIGINT', () => process.exit());

