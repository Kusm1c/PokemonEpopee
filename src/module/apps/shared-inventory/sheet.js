/**
 * Shared Inventory — "un système d'inventaire partagé accessible à tous, duquel les
 * joueurs peuvent drag'n'drop vers leur fiche ET inversement. Inclut à la fois
 * Pokémons & Items."
 *
 * Storage design
 * --------------
 * The container is a normal Actor flagged `flags.ptu.sharedInventory`, with every player
 * set to OWNER. That choice buys two things Foundry will not give a world-setting or a
 * Journal:
 *
 *   - **Items** are real embedded Items on that Actor, so moving them in and out is the
 *     engine's own document transfer. No custom serialisation, no drift.
 *   - **Players can write to it.** World settings are GM-only; an owned Actor is not, so
 *     a player can drop into the bag without a socket round-trip to the GM.
 *
 * Pokemon are Actors, and Foundry cannot embed an Actor inside an Actor. They are held
 * as a list of UUIDs in `flags.ptu.sharedPokemon` and resolved at render time. Dragging
 * a Pokemon out therefore hands over a reference, not a copy — the Actor itself never
 * moves, which is what you want for a shared party pool.
 */

const SHARED_FLAG = "sharedInventory";
const POKEMON_FLAG = "sharedPokemon";

class PTUSharedInventory extends Application {
    constructor(options = {}) {
        super(options);
        this._actor = null;
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "ptu-shared-inventory",
            classes: ["ptu", "sheet", "shared-inventory"],
            title: "Inventaire Partagé",
            template: "systems/ptu/static/templates/apps/shared-inventory.hbs",
            width: 640,
            height: 560,
            resizable: true,
            dragDrop: [{ dragSelector: ".shared-entry", dropSelector: ".shared-drop" }]
        });
    }

    /**
     * The container Actor, or null when the world has none yet.
     * Looked up by flag rather than by name so renaming it doesn't break anything.
     */
    static getContainer() {
        return game.actors.find(a => a.getFlag("ptu", SHARED_FLAG) === true) ?? null;
    }

    get actor() {
        return this._actor ??= PTUSharedInventory.getContainer();
    }

    /** @override */
    async getData() {
        const actor = this.actor;
        if (!actor) return { missing: true, isGM: game.user.isGM };

        const uuids = actor.getFlag("ptu", POKEMON_FLAG) ?? [];
        const pokemon = [];
        const stale = [];

        for (const uuid of uuids) {
            const doc = await fromUuid(uuid).catch(() => null);
            // A Pokemon deleted from the world leaves a dangling uuid; surface it rather
            // than silently dropping it, so nobody wonders where their mon went.
            if (doc) pokemon.push({ uuid, name: doc.name, img: doc.img, level: doc.system?.level?.current ?? "?" });
            else stale.push(uuid);
        }

        return {
            missing: false,
            isGM: game.user.isGM,
            canEdit: actor.isOwner,
            items: actor.items.map(i => ({ id: i.id, name: i.name, img: i.img, quantity: i.system?.quantity ?? 1, type: i.type })),
            pokemon,
            stale
        };
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".shared-item-take").click(ev => this._takeItem(ev));
        html.find(".shared-pokemon-take").click(ev => this._takePokemon(ev));
        html.find(".shared-pokemon-remove").click(ev => this._removePokemon(ev));
        html.find(".shared-open").click(ev => this._openDocument(ev));
        html.find(".shared-prune").click(() => this._pruneStale());
    }

    /* ------------------------------------------------------------------ */
    /* Drag out                                                            */
    /* ------------------------------------------------------------------ */

    /** @override */
    _onDragStart(event) {
        const el = event.currentTarget;
        const { entryType, entryId, uuid } = el.dataset;

        // Foundry's own drag payloads, so the receiving sheet needs no special handling.
        if (entryType === "item") {
            const item = this.actor?.items.get(entryId);
            if (!item) return;
            event.dataTransfer.setData("text/plain", JSON.stringify({
                type: "Item",
                uuid: item.uuid,
                fromSharedInventory: this.actor.id
            }));
            return;
        }

        if (entryType === "pokemon") {
            event.dataTransfer.setData("text/plain", JSON.stringify({ type: "Actor", uuid }));
        }
    }

    /* ------------------------------------------------------------------ */
    /* Drop in                                                             */
    /* ------------------------------------------------------------------ */

    /** @override */
    async _onDrop(event) {
        const actor = this.actor;
        if (!actor) return ui.notifications.warn("Aucun conteneur d'inventaire partagé dans ce monde.");
        if (!actor.isOwner) return ui.notifications.warn("Tu n'as pas la permission d'écrire dans l'inventaire partagé.");

        let data;
        try { data = JSON.parse(event.dataTransfer.getData("text/plain")); }
        catch { return; }

        if (data.type === "Item") return this._dropItem(data);
        if (data.type === "Actor") return this._dropActor(data);
    }

    async _dropItem(data) {
        const item = await fromUuid(data.uuid).catch(() => null);
        if (!item) return;

        const source = item.actor;
        if (source?.id === this.actor.id) return; // already here

        await this.actor.createEmbeddedDocuments("Item", [item.toObject()]);

        // Moving, not copying: take it off the sheet it came from. Compendium drops have
        // no parent actor, so nothing is removed in that case.
        if (source && source.isOwner) await source.deleteEmbeddedDocuments("Item", [item.id]);

        ui.notifications.info(`${item.name} → inventaire partagé.`);
        this.render(false);
    }

    async _dropActor(data) {
        const doc = await fromUuid(data.uuid).catch(() => null);
        if (!doc) return;
        if (doc.type !== "pokemon") return ui.notifications.warn("Seuls les Pokémon peuvent aller dans l'inventaire partagé.");

        const current = this.actor.getFlag("ptu", POKEMON_FLAG) ?? [];
        if (current.includes(doc.uuid)) return ui.notifications.info(`${doc.name} y est déjà.`);

        await this.actor.setFlag("ptu", POKEMON_FLAG, [...current, doc.uuid]);
        ui.notifications.info(`${doc.name} → inventaire partagé.`);
        this.render(false);
    }

    /* ------------------------------------------------------------------ */
    /* Take (the click-based counterpart to dragging out)                  */
    /* ------------------------------------------------------------------ */

    /**
     * Where a click-to-take should send things: the actor this user controls.
     * Falls back to asking when a user owns several, rather than guessing.
     */
    async _resolveRecipient() {
        const owned = game.actors.filter(a => a.isOwner && a.type === "character");
        if (!owned.length) return ui.notifications.warn("Tu ne contrôles aucun Dresseur."), null;
        if (owned.length === 1) return owned[0];

        const options = owned.map(a => `<option value="${a.id}">${a.name}</option>`).join("");
        const id = await Dialog.prompt({
            title: "Destinataire",
            content: `<div class="form-group"><label>Envoyer vers</label><select id="ptu-recipient">${options}</select></div>`,
            label: "Confirmer",
            callback: html => html.find("#ptu-recipient").val()
        }).catch(() => null);

        return id ? game.actors.get(id) : null;
    }

    async _takeItem(event) {
        const id = event.currentTarget.closest(".shared-entry")?.dataset.entryId;
        const item = this.actor?.items.get(id);
        if (!item) return;

        const target = await this._resolveRecipient();
        if (!target) return;

        await target.createEmbeddedDocuments("Item", [item.toObject()]);
        await this.actor.deleteEmbeddedDocuments("Item", [id]);
        ui.notifications.info(`${item.name} → ${target.name}.`);
        this.render(false);
    }

    async _takePokemon(event) {
        const uuid = event.currentTarget.closest(".shared-entry")?.dataset.uuid;
        const doc = await fromUuid(uuid).catch(() => null);
        if (!doc) return;

        const target = await this._resolveRecipient();
        if (!target) return;

        // The Pokemon Actor stays where it is; ownership is what moves. This mirrors how
        // `pokemon/document.js` already resolves a trainer, via flags.ptu.party.trainer.
        await doc.update({ "flags.ptu.party.trainer": target.id });
        await this._removeUuid(uuid);
        ui.notifications.info(`${doc.name} → ${target.name}.`);
        this.render(false);
    }

    async _removePokemon(event) {
        const uuid = event.currentTarget.closest(".shared-entry")?.dataset.uuid;
        if (uuid) await this._removeUuid(uuid);
        this.render(false);
    }

    async _removeUuid(uuid) {
        const current = this.actor.getFlag("ptu", POKEMON_FLAG) ?? [];
        await this.actor.setFlag("ptu", POKEMON_FLAG, current.filter(u => u !== uuid));
    }

    async _pruneStale() {
        const current = this.actor.getFlag("ptu", POKEMON_FLAG) ?? [];
        const alive = [];
        for (const uuid of current) {
            if (await fromUuid(uuid).catch(() => null)) alive.push(uuid);
        }
        await this.actor.setFlag("ptu", POKEMON_FLAG, alive);
        ui.notifications.info(`${current.length - alive.length} référence(s) morte(s) retirée(s).`);
        this.render(false);
    }

    async _openDocument(event) {
        const el = event.currentTarget.closest(".shared-entry");
        const { entryType, entryId, uuid } = el.dataset;
        const doc = entryType === "item" ? this.actor?.items.get(entryId) : await fromUuid(uuid).catch(() => null);
        doc?.sheet?.render(true);
    }
}

export { PTUSharedInventory, SHARED_FLAG, POKEMON_FLAG };
