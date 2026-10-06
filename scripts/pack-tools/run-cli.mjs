/**
 * Calls the official Foundry CLI's extractPack / compilePack.
 *
 * The CLI's own `fvtt` binary expects a configured data path and a "current package",
 * which is machinery this repo does not need - the pack directories are right here. Its
 * documented API does the same work in two calls, so that is what this uses.
 *
 * Invoked by pack.ps1, which supplies Foundry's Node and links the dependencies.
 */
import { extractPack, compilePack } from "./fvtt-cli/index.mjs";

const [command, source, destination] = process.argv.slice(2);

if (!command || !source || !destination) {
    console.error("usage: run-cli.mjs extract|compile <source> <destination>");
    process.exit(1);
}

try {
    if (command === "extract") {
        await extractPack(source, destination, { log: true });
    } else if (command === "compile") {
        await compilePack(source, destination, { log: true });
    } else {
        console.error(`unknown command: ${command}`);
        process.exit(1);
    }
} catch (error) {
    console.error("ERREUR:", error.message);
    process.exit(1);
}
