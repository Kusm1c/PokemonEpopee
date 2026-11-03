/**
 * Common moves: Lutte, Garde, Réaction - and any move a GM adds the same way.
 *
 * "Lutte, Réaction, Garde devraient être des capacités. À la fois pour Pokémon & Dresseur."
 * A move in the Moves compendium with "Capacité commune" ticked (`system.common`) is given
 * to every Pokemon and Trainer, the way PTR handed out Struggle: it is added to each
 * actor's moves when they are prepared, nothing is copied onto the sheets. Creating,
 * editing or deleting the compendium entry is all it takes to change it everywhere.
 *
 * Pokemon only get a common move from `system.commonLoyalty` Loyalty on; Trainers always.
 */

const PACK_ID = "pe.moves";

/** Plain move data, ready to become a temporary item on an actor. */
let sources = [];

/** Read the common moves out of the compendium, then refresh every actor. */
async function loadCommonMoves() {
    const pack = game.packs.get(PACK_ID);
    if (!pack) return;

    const index = await pack.getIndex({ fields: ["system.common"] });
    const ids = index.filter((entry) => entry.system?.common).map((entry) => entry._id);
    const documents = ids.length ? await pack.getDocuments({ _id__in: ids }) : [];

    sources = documents.map((doc) => {
        const source = doc.toObject();
        delete source._id;
        source.flags = foundry.utils.mergeObject(source.flags ?? {}, { core: { sourceId: doc.uuid } });
        return source;
    });

    refreshActors();
}

/** Prepared actors only pick up a change when they are prepared again. */
function refreshActors() {
    const actors = new Set(game.actors.contents);
    for (const token of canvas?.tokens?.placeables ?? []) if (token.actor) actors.add(token.actor);
    for (const actor of actors) {
        actor.reset();
        if (actor.sheet?.rendered) actor.sheet.render(false);
    }
}

/** @returns {object[]} */
function commonMoveSources() {
    return sources;
}

/**
 * Whether a Pokemon's Loyalty is high enough for a common move. Trainers always are.
 * @returns {{locked: boolean, required: number, current: number}}
 */
function commonMoveAccess(actor, move) {
    const required = Number(move.system.commonLoyalty) || 0;
    if (actor.type !== "pokemon") return { locked: false, required: 0, current: 0 };
    const current = Number(actor.system.loyalty?.checked) || 0;
    return { locked: current < required, required, current };
}

export { PACK_ID, loadCommonMoves, commonMoveSources, commonMoveAccess };
