import {checkLiteLLM, expandEnvModel, expandLLMModels, validateEnvModel} from "@/agents/LLM_Agent/preflight/llm";

interface LeafCheck {
    name: string;
    check: () => Promise<void>;
}

interface GroupCheck {
    name: string;
    expand: () => Promise<Array<[string, () => Promise<void>]>>;
    // Called after all sub-items run; throws to mark the group as failed
    validate?: (passed: Set<string>, failed: Set<string>) => void;
}

type PreflightEntry = LeafCheck | GroupCheck;

//====================================================================================================
const checkAllModels = process.env.PREFLIGHT_ALL_LLM_MODELS === "true";

const preflight: PreflightEntry[] = [
    { name: "LiteLLM",    check: checkLiteLLM },
    checkAllModels
        ? { name: "LLM Models", expand: expandLLMModels, validate: validateEnvModel }
        : { name: "LLM Model",  expand: expandEnvModel },
];
//====================================================================================================


const DOTS = ['   ', '.  ', '.. ', '...'];

async function runWithSpinner(
    name: string,
    check: () => Promise<void>,
    indent = "  "
): Promise<unknown> {
    let frame = 0;
    const spinner = setInterval(() => {
        process.stdout.write(`\r${indent}\x1b[2m○\x1b[0m ${name}${DOTS[frame++ % DOTS.length]}`);
    }, 200);

    try {
        await check();
        clearInterval(spinner);
        process.stdout.write(`\r${indent}\x1b[32m✓\x1b[0m ${name}   \n`);
        return null;
    } catch (error) {
        clearInterval(spinner);
        process.stdout.write(`\r${indent}\x1b[31m✗\x1b[0m ${name}   \n`);
        return error;
    }
}

type GroupFailure = { name: string; subFailures: { name: string; error: unknown }[]; validateError?: unknown };

async function runGroupCheck(entry: GroupCheck): Promise<GroupFailure | null> {
    let frame = 0;
    const spinner = setInterval(() => {
        process.stdout.write(`\r  \x1b[2m○\x1b[0m ${entry.name}${DOTS[frame++ % DOTS.length]}`);
    }, 200);

    let subItems: Array<[string, () => Promise<void>]>;
    try {
        subItems = await entry.expand();
        clearInterval(spinner);
        process.stdout.write(`\r  \x1b[2m○\x1b[0m ${entry.name}   \n`);
    } catch (error) {
        clearInterval(spinner);
        process.stdout.write(`\r  \x1b[31m✗\x1b[0m ${entry.name}   \n`);
        return { name: entry.name, subFailures: [{ name: "expand", error }] };
    }

    const passed = new Set<string>();
    const failed = new Set<string>();
    const subFailures: { name: string; error: unknown }[] = [];

    for (const [label, check] of subItems) {
        const error = await runWithSpinner(label, check, "    ");
        if (error === null) {
            passed.add(label);
        } else {
            failed.add(label);
            subFailures.push({ name: label, error });
        }
    }

    let validateError: unknown = null;
    if (entry.validate) {
        try {
            entry.validate(passed, failed);
        } catch (err) {
            validateError = err;
        }
    }

    // Move cursor up past all sub-items to overwrite the top-level line in place
    const linesUp = subItems.length + 1;
    process.stdout.write(`\x1b[${linesUp}A`);

    const groupFailed = subFailures.length > 0 || validateError !== null;
    if (!groupFailed) {
        process.stdout.write(`\r\x1b[2K  \x1b[32m✓\x1b[0m ${entry.name}\n`);
        process.stdout.write(`\x1b[${subItems.length}B`);
        return null;
    }

    process.stdout.write(`\r\x1b[2K  \x1b[31m✗\x1b[0m ${entry.name}${subFailures.length > 0 ? ` (${subFailures.length} failed)` : ""}\n`);
    process.stdout.write(`\x1b[${subItems.length}B`);
    return { name: entry.name, subFailures, validateError: validateError ?? undefined };
}

export async function runPreflight(): Promise<void> {
    console.log("\x1b[43m\t\t\t\t\t\x1b[0m");

    console.log("\x1b[33m\x1b[1mRunning preflight checks...\x1b[0m\n");

    const failures: Array<{ name: string; error?: unknown; subFailures?: { name: string; error: unknown }[]; validateError?: unknown }> = [];

    for (const entry of preflight) {
        if ("expand" in entry) {
            const result = await runGroupCheck(entry);
            if (result !== null) failures.push(result);
        } else {
            const error = await runWithSpinner(entry.name, entry.check);
            if (error !== null) failures.push({ name: entry.name, error });
        }
    }

    const passed = preflight.length - failures.length;
    console.log(`\n\x1b[1mResults: ${passed}/${preflight.length} checks passed\x1b[0m`);

    if (failures.length === 0) {
        console.log("\x1b[32mAll systems ready.\x1b[0m\n");
    } else {
        console.log("\n\x1b[31mFailed checks:\x1b[0m");
        for (const failure of failures) {
            if (failure.subFailures) {
                console.log(`  \x1b[1m${failure.name}\x1b[0m:`);
                for (const sub of failure.subFailures) {
                    const message = sub.error instanceof Error ? sub.error.message : String(sub.error);
                    console.log(`    \x1b[31m✗\x1b[0m ${sub.name}: ${message}`);
                }
                if (failure.validateError) {
                    const message = failure.validateError instanceof Error ? failure.validateError.message : String(failure.validateError);
                    console.log(`    \x1b[33m⚠\x1b[0m ${message}`);
                }
            } else {
                const message = failure.error instanceof Error ? failure.error.message : String(failure.error);
                console.log(`  \x1b[1m${failure.name}\x1b[0m: ${message}`);
            }
        }

        throw new Error(`Preflight failed: ${failures.map(f => f.name).join(", ")}`);
    }

    console.log("\x1b[43m\t\t\t\t\t\x1b[0m\n");
}
