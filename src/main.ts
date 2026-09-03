import 'dotenv/config'
import {config} from './config'
import readline from 'readline';

import { DjsConnect } from "@matteoranzi/deliveroo-js-sdk/client";
import {Belief, GameMap} from "@/agents/BDI_Agent/beliefs/Belief"
import {adaptMapPayload} from "@/io/adapters/mapAdapter";
import {adaptSelfSensingPayload, adaptSensingPayload} from "@/io/adapters/sensingAdapter";
import {GameConfig} from "@/agents/BDI_Agent/beliefs/Belief";
import {adaptConfigPayload} from "@/io/adapters/configAdapter";
import {Agent} from "@/agents/BDI_Agent/beliefs/primitives/Agent";

const djsClient = DjsConnect(config.host, config.token);
let belief: Belief;

let gameConfig: GameConfig;
let gameMap: GameMap;
let me: Agent;

function main() {
    initialize().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

main();



async function initialize() {
    djsClient.onConnect(() => console.log('Connected: ' + djsClient.id));
    djsClient.onDisconnect(() => console.log('Disconnected: ' + djsClient.id));

    console.log("Waiting for game config, map and self sensing...");

    await Promise.all([
        waitForConfig(),
        waitForMap(),
        waitForYou(),
    ])

    belief = new Belief(gameConfig, gameMap, me);
    console.log("Belief initialized");

    djsClient.onSensing((sensing) => {
        belief.updateBeliefs(adaptSensingPayload(sensing));
        // console.log("sensing...")
    })

    djsClient.onYou((me) => {
        belief.updateMe(adaptSelfSensingPayload(me));
        // console.log("me updated...")
    })


    // Render in the terminal's alternate screen buffer, so redraws never touch
    // (or get pushed into) the normal scrollback and scrolling can't reveal stale frames.
    process.stdout.write('\x1b[?1049h\x1b[?25l');
    setInterval(() => {
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
        process.stdout.write(belief.toString());
    }, belief.gameConfig.clock);
}

function waitForConfig() {
    return new Promise<void>((resolve) => {
        djsClient.onConfig((config) => {
            gameConfig = adaptConfigPayload(config);

            resolve();
        });
    });
}

function waitForMap() {
    return new Promise<void>((resolve) => {
        djsClient.onMap((_width, _height, tiles) => {
            gameMap = (adaptMapPayload(_width, _height, tiles));
        })
        resolve();
    });
}

function waitForYou() {
    return new Promise<void>((resolve) => {
        djsClient.onYou((you) => {
            me = adaptSelfSensingPayload(you);
            resolve();
        });
    });
}


//====================================================


function restoreTerminal(): void {
    process.stdout.write('\x1b[?25h\x1b[?1049l');
}
process.on('exit', restoreTerminal);
process.on('SIGINT', () => process.exit());

