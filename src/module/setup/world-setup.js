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
import { migrateSystemId } from "./id-migration.js";
import { injectSkillChoices } from "./skill-choices.js";
import { sluggify } from "../../util/misc.js";

/** Bump when new setup steps are added, so existing worlds pick them up. */
const SETUP_VERSION = 6;

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
 * The heavy, once-per-version steps: rewriting compendiums and creating content.
 *
 * Gated behind SETUP_VERSION because it walks all 17 packs — far too expensive to repeat
 * on every load. Macro syncing is deliberately NOT in here; see syncMacros().
 *
 * @returns {Promise<string[]>} human-readable lines describing what changed
 */
async function runWorldSetup() {
    const log = [];

    // Runs first: the steps below look items up by name in the compendiums, and a pack
    // full of dead Compendium.ptu.* links is exactly what this repairs.
    await migrateSystemId(log);

    // After the id migration, before anything that reads the packs back: the skill
    // ChoiceSet lists are baked into item data and don't know about Epopee's new skill.
    await injectSkillChoices(log);

    await setupConditions(log);
    await setupSharedInventory(log);
    await repairChoiceFlags(log);

    return log;
}

/**
 * Keep the macros in step with `macros.js`, on every load.
 *
 * Split out of the versioned setup on purpose: editing a macro's `img` or `command` is
 * an ordinary thing to do, and having to bump SETUP_VERSION or reset a world setting to
 * see the change was friction with no upside. This pass reads 7 definitions and writes
 * only where something actually differs, so running it every time costs nothing.
 *
 * @returns {Promise<string[]>}
 */
async function syncMacros() {
    const log = [];
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
            // Compare the icon too: editing `img` in macros.js is the intended way to
            // restyle these, and only syncing `command` would silently ignore that.
            const changes = {};
            if (existing.command !== command) changes.command = command;
            if (existing.img !== spec.img) changes.img = spec.img;

            if (!Object.keys(changes).length) continue;
            await existing.update(changes);
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

/**
 * Repair choices made on items whose name had been translated.
 *
 * A ChoiceSet without an explicit flag used to take it from the item's *name*. The rules
 * that read the choice address it by the English name ("basicSkills"), so on an item
 * renamed "Compétence Basique" the choice was stored under "compétenceBasique" and never
 * found: the skill stayed Untrained. The flag now comes from the slug; this rewrites the
 * flag already saved on owned items, and swaps a raw skill key in the name ("(intuition)")
 * for the skill's name.
 */
async function repairChoiceFlags(log) {
    let repaired = 0;
    for (const actor of game.actors) {
        const updates = [];
        for (const item of actor.items) {
            const rules = foundry.utils.deepClone(item._source.system?.rules ?? []);
            if (!rules.some(r => r.key === "ChoiceSet")) continue;

            const referenced = new Set([...JSON.stringify(rules).matchAll(/rulesSelections\.([A-Za-z0-9_-]+)/g)].map(m => m[1]));
            const expected = sluggify(item.slug ?? item.name, { camel: "dromedary" });
            let changed = false;
            for (const rule of rules) {
                if (rule.key !== "ChoiceSet" || typeof rule.flag !== "string" || rule.flag.startsWith("{")) continue;
                if (rule.flag !== expected && !referenced.has(rule.flag) && referenced.has(expected)) {
                    rule.flag = expected;
                    changed = true;
                }
            }

            const update = { _id: item.id };
            if (changed) update["system.rules"] = rules;

            const skill = item.name.match(/\(([A-Za-z]+)\)$/)?.[1];
            if (skill && game.i18n.has(`PTU.Skills.${skill}`)) {
                update.name = item.name.replace(/\(([A-Za-z]+)\)$/, `(${game.i18n.localize(`PTU.Skills.${skill}`)})`);
            }
            if (Object.keys(update).length > 1) updates.push(update);
        }
        if (updates.length) {
            await actor.updateEmbeddedDocuments("Item", updates);
            repaired += updates.length;
        }
    }
    if (repaired) log.push(`${repaired} objet(s) à choix réparé(s) (Compétence Basique…).`);
}

export { runWorldSetup, syncMacros, SETUP_VERSION };
