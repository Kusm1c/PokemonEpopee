/**
 * Read and write Foundry LevelDB compendium packs without installing anything.
 *
 * Foundry ships `classic-level` (the same library foundryvtt-cli uses, same major
 * version) inside its own install, and its Electron binary runs plain scripts when
 * ELECTRON_RUN_AS_NODE is set. That gives a modern Node plus the native LevelDB binding
 * on a machine with neither installed.
 *
 *   $env:ELECTRON_RUN_AS_NODE = "1"
 *   & "C:\Program Files\Foundry Virtual Tabletop\Foundry Virtual Tabletop.exe" pack-tool.js <cmd> ...
 *
 * Commands:
 *   extract <packDir> <outDir>     one .json per document, named <collection>_<id>.json
 *   compile <inDir>  <packDir>     write those documents back into the pack
 *   list    <packDir>              names only, for a quick look
 *
 * Options mirror the CLI: utf8 keys, JSON values, createIfMissing:false so a mistyped
 * path fails instead of silently creating an empty database.
 *
 * Foundry must be CLOSED: LevelDB takes an exclusive lock, and a second writer either
 * fails or corrupts the pack.
 */
const fs = require("fs");
const path = require("path");

const FOUNDRY_APP = process.env.FOUNDRY_APP
    || "C:\\Program Files\\Foundry Virtual Tabletop\\resources\\app";
const { ClassicLevel } = require(path.join(FOUNDRY_APP, "node_modules", "classic-level"));

const DB_OPTIONS = { keyEncoding: "utf8", valueEncoding: "json", createIfMissing: false };

/** A key is `!collection!id`; anything with a dot is an embedded document. */
function parseKey(key) {
    const parts = key.split("!");
    return { collection: parts[1] ?? "", id: parts[2] ?? "" };
}

/**
 * `<Name>_<id>.json`, matching foundryvtt-cli's own convention.
 *
 * The filename is for humans only - compile reads `_key` from inside the file - but with
 * 1300 moves in a pack, `items_QMaJ91E3XBatUcV9.json` is unfindable while
 * `Thunderbolt_QMaJ91E3XBatUcV9.json` is obvious. Folders and other non-item collections
 * keep a collection prefix so they do not get mixed in with the documents.
 */
function fileNameFor(key, doc) {
    const { collection, id } = parseKey(key);
    const safe = (s) => String(s).replace(/[^\w.\-]/g, "_");

    const prefix = collection === "items" ? "" : `${safe(collection)}_`;
    const name = doc?.name ? `${safe(doc.name)}_` : "";

    return `${prefix}${name}${safe(id)}.json`;
}

async function withDb(packDir, fn) {
    const db = new ClassicLevel(packDir, DB_OPTIONS);
    await db.open();
    try {
        return await fn(db);
    } finally {
        await db.close();
    }
}

async function extract(packDir, outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    const count = await withDb(packDir, async db => {
        let n = 0;
        for await (const [key, value] of db.iterator()) {
            // Preserve the key so compile can put the document back exactly where it was.
            const payload = { _key: key, ...value };
            fs.writeFileSync(
                path.join(outDir, fileNameFor(key, value)),
                JSON.stringify(payload, null, 2),
                "utf8"
            );
            n++;
        }
        return n;
    });
    console.log(`extracted ${count} document(s) to ${outDir}`);
}

async function compile(inDir, packDir) {
    const files = fs.readdirSync(inDir).filter(f => f.endsWith(".json"));
    if (!files.length) throw new Error(`no .json files in ${inDir}`);

    const ops = [];
    for (const file of files) {
        // Strip a UTF-8 BOM: PowerShell's Set-Content writes one by default and
        // JSON.parse rejects it, which would otherwise look like a corrupt export.
        const raw = fs.readFileSync(path.join(inDir, file), "utf8").replace(/^﻿/, "");
        const doc = JSON.parse(raw);
        const key = doc._key;
        if (!key) throw new Error(`${file} has no _key - was it produced by extract?`);
        const value = { ...doc };
        delete value._key;
        ops.push({ type: "put", key, value });
    }

    await withDb(packDir, db => db.batch(ops));
    console.log(`wrote ${ops.length} document(s) into ${packDir}`);
}

async function list(packDir) {
    await withDb(packDir, async db => {
        for await (const [key, value] of db.iterator()) {
            const { collection } = parseKey(key);
            if (collection.includes(".")) continue;  // embedded, not a primary document
            console.log(`${key}\t${value?.name ?? ""}`);
        }
    });
}

const [cmd, a, b] = process.argv.slice(2);
const run = {
    extract: () => extract(a, b),
    compile: () => compile(a, b),
    list: () => list(a)
}[cmd];

if (!run) {
    console.error("usage: pack-tool.js extract|compile|list <args>");
    process.exit(1);
}

run().catch(e => {
    console.error("ERROR:", e.message);
    process.exit(1);
});
