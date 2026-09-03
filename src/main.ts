import 'dotenv/config'
import {config} from './config'
import readline from 'readline';

import { DjsConnect } from "@matteoranzi/deliveroo-js-sdk/client";
import {Belief} from "@/agents/BDI_Agent/beliefs/Belief"
import {adaptMapPayload} from "@/io/adapters/mapAdapter";
import {adaptSensingPayload} from "@/io/adapters/sensingAdapter";
import {GameConfig} from "@/agents/BDI_Agent/beliefs/Belief";
import {adaptConfigPayload} from "@/io/adapters/configAdapter";

const djsClient = DjsConnect(config.host, config.token);
let gameConfig: GameConfig;

djsClient.onConnect(() => console.log('Connected: ' + djsClient.id));
djsClient.onDisconnect(() => console.log('Disconnected: ' + djsClient.id));


// let belief: Belief;
// djsClient.onConfig((config) => {
//     belief = new Belief(adaptConfigPayload(config));
//
//     setInterval(() => {
//         readline.cursorTo(process.stdout, 0, 0);
//         readline.clearScreenDown(process.stdout);
//         process.stdout.write(belief.toString());
//     }, 1000);
// })

let belief: Belief;

// Render in the terminal's alternate screen buffer, so redraws never touch
// (or get pushed into) the normal scrollback and scrolling can't reveal stale frames.
process.stdout.write('\x1b[?1049h\x1b[?25l');
function restoreTerminal(): void {
    process.stdout.write('\x1b[?25h\x1b[?1049l');
}
process.on('exit', restoreTerminal);
process.on('SIGINT', () => process.exit());

djsClient.onConfig((config) => {
    gameConfig = adaptConfigPayload(config);
    belief = new Belief(gameConfig);

    setInterval(() => {
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
        process.stdout.write(belief.toString());
    }, 1000);
})

djsClient.onMap((_width, _height, tiles) => {
    belief.setGameMap(adaptMapPayload(_width, _height, tiles));
})


djsClient.onSensing((sensing) => {
    belief.updateBeliefs(adaptSensingPayload(sensing));
    // console.log(sensing.parcels);
})