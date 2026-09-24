/**
 * Rewrites stored `Compendium.ptu.*` references to `Compendium.pe.*`.
 *
 * The system id changed from `ptu` to `pe` so this fork can sit alongside an existing
 * PTR install. Renaming touched the code, but roughly 1900 UUIDs live *inside document
 * data* - ChoiceSet rules, grants, evolution links, automatic effects - and those kept
 * pointing at a pack id that no longer exists. `fromUuid()` returned null, which is why
 * a new Trainer opened an empty "Grant: Training Feature" prompt.
 *
 * Approach: serialise each document, string-replace, parse back. Blunt, but total - the
 * references are buried at arbitrary depth inside `system.rules` and similar, and a
 * targeted walk would miss shapes nobody remembered. `Compendium.ptu.` is specific
 * enough that a false positive is not a realistic worry.
 *
 * Only documents that actually contain the string are written, so the pass is cheap on
 * a world that has already been migrated.
 */

const OLD_PREFIX = "Compendium.ptu.";
const NEW_PREFIX = "Compendium.pe.";

/**
 * @param {object} doc
 * @returns {object|null} the rewritten source, or null when nothing referenced the old id
 */
function rewriteSource(doc) {
    const json = JSON.stringify(doc.toObject());
    if (!json.includes(OLD_PREFIX)) return null;
    return JSON.parse(json.split(OLD_PREFIX).join(NEW_PREFIX));
}

/**
 * Rewrite every compendium in the system.
 *
 * Packs are unlocked only if they were locked, and restored afterwards, so a GM's own
 * lock preferences survive.
 */
async function migrateCompendiums(log) {
    let packsTouched = 0;
    let docsTouched = 0;

    for (const pack of game.packs) {
        // Only this system's packs; module and world compendiums are not ours to rewrite.
        if (pack.metadata.packageType !== "system") continue;

        const wasLocked = pack.locked;
        if (wasLocked) await pack.configure({ locked: false });

        try {
            const docs = await pack.getDocuments();
            const updates = [];

            for (const doc of docs) {
                const rewritten = rewriteSource(doc);
                if (rewritten) updates.push(rewritten);
            }

            if (updates.length) {
                await pack.documentClass.updateDocuments(updates, { pack: pack.collection });
                packsTouched++;
                docsTouched += updates.length;
            }
        } catch (error) {
            log.push(`⚠ Pack ${pack.collection} : ${error.message}`);
        } finally {
            if (wasLocked) await pack.configure({ locked: true });
        }
    }

    if (docsTouched) log.push(`${docsTouched} document(s) de compendium réécrits dans ${packsTouched} pack(s).`);
    return docsTouched;
}

/**
 * Rewrite documents already created in the world - actors, their embedded items, and
 * loose items. Without this, Pokemon and Trainers made before the rename keep their dead
 * links even though the compendiums are fixed.
 */
async function migrateWorldDocuments(log) {
    let touched = 0;

    for (const actor of game.actors) {
        const rewritten = rewriteSource(actor);
        if (rewritten) {
            await actor.update(rewritten, { diff: false, recursive: false });
            touched++;
            continue;
        }

        // The actor itself may be clean while an embedded item is not.
        const itemUpdates = [];
        for (const item of actor.items) {
            const itemSource = rewriteSource(item);
            if (itemSource) itemUpdates.push(itemSource);
        }
        if (itemUpdates.length) {
            await actor.updateEmbeddedDocuments("Item", itemUpdates, { diff: false, recursive: false });
            touched += itemUpdates.length;
        }
    }

    for (const item of game.items) {
        const rewritten = rewriteSource(item);
        if (rewritten) {
            await item.update(rewritten, { diff: false, recursive: false });
            touched++;
        }
    }

    if (touched) log.push(`${touched} document(s) du monde réécrits.`);
    return touched;
}

/**
 * @param {string[]} log
 */
async function migrateSystemId(log) {
    const before = log.length;

    await migrateCompendiums(log);
    await migrateWorldDocuments(log);

    if (log.length === before) log.push("Références de compendium : déjà à jour.");
}

export { migrateSystemId, OLD_PREFIX, NEW_PREFIX };
