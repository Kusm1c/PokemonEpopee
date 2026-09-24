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

/**
 * Every stored form of the old system id, as literal string swaps.
 *
 * `Compendium.ptu.` covers UUIDs in rule elements, grants and evolution links.
 * `systems/ptu/` covers asset paths baked into document `img` fields - condition icons,
 * sprites, item art - which the first pass missed entirely and which surface as
 * "Invalid Asset systems/ptu/..." the moment a token tries to draw one.
 *
 * Both are specific enough that a false positive is not a realistic worry. The flag
 * namespace is handled separately, structurally, in `migrateFlags`.
 */
const STRING_SWAPS = [
    ["Compendium.ptu.", "Compendium.pe."],
    ["systems/ptu/", "systems/pe/"],
    // Dotted paths written inside rule-element values, e.g. an injected property like
    // "{item|flags.ptu.rulesSelections.basicSkills}". Moving the flags object is not
    // enough - these references are plain strings and stay pointed at the old
    // namespace, so the rule fails to resolve and its ChoiceSet ends up empty.
    //
    // Safe alongside migrateFlags: JSON.stringify writes the flags *object* as
    // "flags":{"ptu":... , which this pattern cannot match.
    ["flags.ptu.", "flags.pe."]
];

/**
 * @param {object} doc
 * @returns {object|null} the rewritten source, or null when nothing referenced the old id
 */
function rewriteSource(doc) {
    const source = doc.toObject();
    let json = JSON.stringify(source);

    const needsSwap = STRING_SWAPS.some(([from]) => json.includes(from));
    const needsFlags = source.flags?.ptu !== undefined;
    if (!needsSwap && !needsFlags) return null;

    for (const [from, to] of STRING_SWAPS) {
        if (json.includes(from)) json = json.split(from).join(to);
    }

    const rewritten = JSON.parse(json);
    migrateFlags(rewritten);
    return rewritten;
}

/**
 * Move `flags.ptu` to `flags.pe`.
 *
 * Done structurally rather than by string surgery: a blanket `"ptu":` replacement would
 * also hit legitimate data. Existing `flags.pe` keys win, so re-running cannot clobber
 * anything the new code has already written.
 *
 * @param {object} source a document source object, mutated in place
 */
function migrateFlags(source) {
    const old = source?.flags?.ptu;
    if (old === undefined) return;

    source.flags.pe = { ...old, ...(source.flags.pe ?? {}) };
    delete source.flags.ptu;
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

export { migrateSystemId, STRING_SWAPS };
