/**
 * Automatic world setup for Pokemon Epopee.
 *
 * Replaces the console scripts under `scripts/foundry-console/` that a GM previously had
 * to paste by hand: the conditions, the Trap/Coat items and the shared inventory now
 * install themselves the first time a GM loads a world.
 *
 * Two properties make that safe:
 *
 *   - **Idempotent.** Every step checks before it writes, so running it twice changes
 *     nothing. A partially-applied setup (someone ran half the old scripts) heals on the
 *     next load instead of duplicating.
 *   - **Versioned.** `epopeeSetupVersion` records how far a world has been taken. Adding
 *     content later means bumping SETUP_VERSION, and only the new steps run.
 *
 * The console scripts are kept as a manual fallback - if a step is ever skipped by a
 * permissions quirk, a GM can still paste the matching file.
 */

import { SHARED_FLAG, POKEMON_FLAG } from "../apps/shared-inventory/index.js";
import { EPOPEE_MACROS } from "./macros.js";

/** Bump when new setup steps are added, so existing worlds pick them up. */
const SETUP_VERSION = 1;

/** Traps carry a starting duration in rounds; Coats do not expire on a timer. */
const TRAPS = [
    { name: "Secretion", duration: 5 },
    { name: "Time Howl", duration: 20 },
    { name: "Flame Dance", duration: 5 },
    { name: "Magma Vortex", duration: 5 },
    { name: "Free Fall", duration: 1 },
    { name: "Sand Tomb", duration: 5 },
    { name: "Ice Age", duration: 1 },
    { name: "Embrace", duration: 5 },
    // "Dure jusqu'a la fin de la scene" - approximated as a long countdown, since there
    // is no scene-end trigger to hang it on.
    { name: "Block", duration: 999 },
    { name: "Binding", duration: 5 },
    { name: "Clamp", duration: 5 },
    { name: "Siphon", duration: 5 },
    { name: "Spirit Lock", duration: 5 },
    { name: "Harassment", duration: 5 }
];

const COATS = [
    "Fire Whirl", "Mud Throw", "Powder Cloud", "Roots", "Aurora Veil",
    "Mist Coat", "Power Coat", "Substitute", "Aqua Ring"
];

/** Statuses that track an intensity level, with their starting value. */
const VALUED_CONDITIONS = [
    { name: "Poisoned", value: 2 },
    { name: "Sleep", value: 0 }
];

/** Conditions renamed from the original French drafting pass. */
const RENAMES = [
    { to: "Frostbite", from: "Engelure" },
    { to: "Fear", from: "Peur" }
];

/**
 * @returns {Promise<string[]>} human-readable lines describing what changed
 */
async function runWorldSetup() {
    const log = [];

    await setupConditions(log);
    await setupSharedInventory(log);
    await setupMacros(log);

    return log;
}

/**
 * Install (or refresh) the Epopee macros.
 *
 * Existing macros are updated rather than duplicated, so a world that ran the old
 * console scripts ends up with one copy carrying the current command, not two.
 */
async function setupMacros(log) {
    let created = 0;
    let updated = 0;

    for (const spec of EPOPEE_MACROS) {
        const command = spec.command.trim();
        const existing = game.macros.find(m => m.name === spec.name);

        if (existing) {
            if (existing.command === command) continue;
            await existing.update({ command });
            updated++;
            continue;
        }

        await Macro.create({
            name: spec.name,
            type: "script",
            scope: "global",
            img: spec.img,
            command
        });
        created++;
    }

    if (created) log.push(`${created} macro(s) créée(s).`);
    if (updated) log.push(`${updated} macro(s) mise(s) à jour.`);
}

async function setupConditions(log) {
    const pack = game.packs.get("pe.effects");
    if (!pack) {
        log.push("⚠ Compendium pe.effects introuvable — conditions non installées.");
        return;
    }

    const wasLocked = pack.locked;
    if (wasLocked) await pack.configure({ locked: false });

    try {
        const index = await pack.getIndex();
        const folder = pack.folders?.find(f => f.name === "Conditions") ?? null;
        const byName = (n) => index.find(i => i.name === n);

        for (const { name, value } of VALUED_CONDITIONS) {
            const entry = byName(name);
            if (!entry) continue;
            const doc = await pack.getDocument(entry._id);
            if (doc.system?.value?.isValued === true && doc.system?.value?.value === value) continue;
            await doc.update({ "system.value.isValued": true, "system.value.value": value });
            log.push(`Intensité configurée : ${name} (${value}).`);
        }

        for (const { to, from } of RENAMES) {
            if (byName(to)) continue;
            const old = byName(from);
            if (!old) continue;
            const doc = await pack.getDocument(old._id);
            await doc.update({ name: to });
            log.push(`Renommé : ${from} → ${to}.`);
        }

        const toCreate = [];
        for (const trap of TRAPS) {
            if (byName(trap.name)) continue;
            toCreate.push({
                name: trap.name,
                type: "condition",
                folder: folder?.id ?? null,
                system: { duration: { value: trap.duration, unit: "rounds", expiry: "turn-start" } }
            });
        }
        for (const name of COATS) {
            if (byName(name)) continue;
            toCreate.push({ name, type: "condition", folder: folder?.id ?? null });
        }

        if (toCreate.length) {
            await pack.documentClass.createDocuments(toCreate, { pack: pack.collection });
            log.push(`${toCreate.length} condition(s) Piège/Manteau créée(s).`);
        }
    } finally {
        // Leave the pack exactly as locked as it was found.
        if (wasLocked) await pack.configure({ locked: true });
    }
}

async function setupSharedInventory(log) {
    let container = game.actors.find(a => a.getFlag("pe", SHARED_FLAG) === true);

    if (!container) {
        container = await Actor.create({
            name: "Inventaire Partagé",
            type: "character",
            img: "icons/svg/mystery-man.svg",
            flags: { pe: { [SHARED_FLAG]: true, [POKEMON_FLAG]: [] } }
        });
        log.push("Conteneur d'inventaire partagé créé.");
    }

    // Every player needs OWNER to drop into it - world settings are GM-only, an owned
    // Actor is not. Re-applied on every setup so players added later are covered.
    const ownership = foundry.utils.duplicate(container.ownership ?? {});
    let changed = ownership.default !== CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    ownership.default = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;

    for (const user of game.users.filter(u => !u.isGM)) {
        if (ownership[user.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) continue;
        ownership[user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
        changed = true;
    }

    if (changed) {
        await container.update({ ownership });
        log.push("Accès à l'inventaire partagé accordé à tous les joueurs.");
    }
}

export { runWorldSetup, SETUP_VERSION };
