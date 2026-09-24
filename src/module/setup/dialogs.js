/**
 * The Epopee GM dialogs, as real modules.
 *
 * These used to live as JavaScript source inside template literals inside a macro
 * definition file — two levels of escaping, which a single find/replace pass across the
 * repo silently corrupted. Written as functions the macros simply call, that failure
 * mode cannot happen: there is no JS-inside-a-string anywhere.
 *
 * Each macro's command is now one line, e.g. `game.pe.epopee.environment()`.
 */

import {
    WEATHER_DEFINITIONS, FIELD_DEFINITIONS, ZONE_DEFINITIONS,
    HAZARD_DEFINITIONS, WALL_DEFINITIONS
} from "../environment/definitions.js";
import { startWeather, startField, clearWeather, clearField, toggleZone } from "../environment/engine.js";
import { placeHazard } from "../environment/hazards.js";
import { placeWall } from "../environment/walls.js";
import { advanceProgression } from "../travel/engine.js";
import { purgeOnRecall } from "../statuses/engine.js";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const opts = (keys, selected) => keys
    .map(k => `<option value="${k}"${k === selected ? " selected" : ""}>${k}</option>`)
    .join("");

const field = (label, inner) => `<div class="form-group"><label>${label}</label>${inner}</div>`;

/** The token a placement dialog should anchor on: targeted first, then selected. */
function anchorToken() {
    return [...game.user.targets][0]?.document ?? canvas.tokens.controlled[0]?.document ?? null;
}

async function prompt({ title, content, label = "Valider", width = 420 }, read) {
    return Dialog.prompt({
        title, content, label,
        options: { width },
        callback: (html) => read(html)
    }).catch(() => null);
}

/* ------------------------------------------------------------------ */
/* Weather / Field / Zones                                             */
/* ------------------------------------------------------------------ */

async function environment() {
    if (!game.combat) return ui.notifications.warn("Aucun combat actif.");

    const active = game.combat.flags.pe?.zones ?? {};
    const zoneRows = Object.keys(ZONE_DEFINITIONS).map(z =>
        `<div class="form-group"><label><input type="checkbox" class="pe-zone" value="${z}"`
        + `${z in active ? " checked" : ""}/> ${z}</label></div>`
    ).join("");

    const result = await prompt({
        title: "Climat / Terrain / Zones",
        content:
            field("Climat", `<select id="pe-weather"><option value="">(aucun)</option>${opts(Object.keys(WEATHER_DEFINITIONS))}</select>`)
            + field("Terrain", `<select id="pe-field"><option value="">(aucun)</option>${opts(Object.keys(FIELD_DEFINITIONS))}</select>`)
            + field("Durée prolongée", `<input type="checkbox" id="pe-extended"/> <span style="font-size:11px;opacity:.7;">objet Roche / Extenseur tenu</span>`)
            + `<hr/><p>Zones (cumulables) :</p>${zoneRows}`,
        label: "Appliquer"
    }, (html) => ({
        weather: html.find("#pe-weather").val(),
        fieldSlug: html.find("#pe-field").val(),
        extended: html.find("#pe-extended").is(":checked"),
        zones: html.find(".pe-zone:checked").map((i, e) => e.value).get()
    }));

    if (!result) return;

    if (result.weather) await startWeather(game.combat, result.weather, result.extended);
    else await clearWeather(game.combat);

    if (result.fieldSlug) await startField(game.combat, result.fieldSlug, result.extended);
    else await clearField(game.combat);

    // toggleZone flips state, so only act where the checkbox differs from what's active.
    for (const slug of Object.keys(ZONE_DEFINITIONS)) {
        const wanted = result.zones.includes(slug);
        if (wanted !== (slug in active)) await toggleZone(game.combat, slug);
    }
}

/* ------------------------------------------------------------------ */
/* Hazards & Walls                                                     */
/* ------------------------------------------------------------------ */

async function hazard() {
    const token = anchorToken();
    if (!token) return ui.notifications.warn("Cible ou sélectionne un token pour marquer l'emplacement.");

    const slug = await prompt({
        title: "Poser un Danger",
        content: field("Danger", `<select id="pe-hazard">${opts(Object.keys(HAZARD_DEFINITIONS))}</select>`),
        label: "Poser"
    }, (html) => html.find("#pe-hazard").val());

    if (!slug) return;
    await placeHazard(token.x, token.y, slug);
}

async function wall() {
    const token = anchorToken();
    if (!token) return ui.notifications.warn("Cible ou sélectionne un token pour marquer le départ du mur.");

    const result = await prompt({
        title: "Poser un Mur",
        content:
            field("Mur", `<select id="pe-wall">${opts(Object.keys(WALL_DEFINITIONS))}</select>`)
            + field("Longueur (cases)", `<input type="number" id="pe-wall-len" value="1" min="1"/>`)
            + field("Durée prolongée", `<input type="checkbox" id="pe-wall-ext"/>`),
        label: "Poser"
    }, (html) => ({
        slug: html.find("#pe-wall").val(),
        length: Number(html.find("#pe-wall-len").val()) || 1,
        extended: html.find("#pe-wall-ext").is(":checked")
    }));

    if (!result) return;
    await placeWall(token.x, token.y, result.slug, result.length, result.extended);
}

/* ------------------------------------------------------------------ */
/* Hex travel                                                          */
/* ------------------------------------------------------------------ */

async function travel() {
    const state = game.user.getFlag("pe", "travelState") ?? { progressionKm: 0, thresholdKm: 6 };
    const tables = game.tables.contents;
    const tableOpts = `<option value="">(aucune)</option>`
        + tables.map(t => `<option value="${t.id}">${t.name}</option>`).join("");

    const result = await prompt({
        title: "Avancer d'un Quart de Voyage",
        width: 460,
        content:
            `<p><b>Progression :</b> ${state.progressionKm} / ${state.thresholdKm} km</p>`
            + field("Seuil de sortie d'hexagone",
                `<select id="pe-th">
                    <option value="6"${state.thresholdKm === 6 ? " selected" : ""}>Départ / côté proche / retour (6 km)</option>
                    <option value="12"${state.thresholdKm === 12 ? " selected" : ""}>Côté lointain (12 km)</option>
                 </select>`)
            + field("Vitesse du groupe (km/h)", `<input type="number" id="pe-speed" value="3" min="0" step="0.5"/>`)
            + field("Multiplicateur rythme / mode", `<input type="number" id="pe-mult" value="1" min="0" step="0.1"/>`)
            + `<hr/>`
            + field("Table Pistes", `<select id="pe-t-tracks">${tableOpts}</select>`)
            + field("Table Antre", `<select id="pe-t-lair">${tableOpts}</select>`)
            + field("Table Errante", `<select id="pe-t-wander">${tableOpts}</select>`),
        label: "Avancer"
    }, (html) => ({
        thresholdKm: Number(html.find("#pe-th").val()),
        speed: Number(html.find("#pe-speed").val()) || 0,
        mult: Number(html.find("#pe-mult").val()) || 1,
        tracks: html.find("#pe-t-tracks").val(),
        lair: html.find("#pe-t-lair").val(),
        wander: html.find("#pe-t-wander").val()
    }));

    if (!result) return;

    const kmThisQuarter = result.speed * 4 * result.mult;
    const next = advanceProgression({
        current: state.progressionKm,
        thresholdKm: result.thresholdKm,
        kmThisQuarter
    });

    await game.user.setFlag("pe", "travelState", {
        progressionKm: next.progressionKm ?? next.overflowKm ?? 0,
        thresholdKm: result.thresholdKm
    });

    const half = await new Roll("1d8").evaluate();
    const lines = [
        `<p>Parcouru ce quart : <b>${kmThisQuarter} km</b></p>`,
        `<p>Demi-heure dans le quart : <b>${half.total}</b></p>`,
        next.exited
            ? `<p><b>Sortie de l'hexagone.</b> Report : ${next.overflowKm ?? 0} km</p>`
            : `<p>Progression : ${next.progressionKm} / ${result.thresholdKm} km</p>`
    ];

    // The doc fixes the order: tracks, then lair, then wandering.
    for (const [label, id] of [["Pistes", result.tracks], ["Antre", result.lair], ["Errante", result.wander]]) {
        if (!id) continue;
        const table = game.tables.get(id);
        if (!table) continue;
        const draw = await table.draw({ displayChat: false });
        const text = draw.results.map(r => r.text ?? r.name ?? "?").join(", ");
        lines.push(`<p><b>${label} :</b> ${text}</p>`);
    }

    await ChatMessage.create({
        flavor: `<div class="header-bar"><p class="action">Voyage</p></div>`,
        content: lines.join("")
    });
}

/* ------------------------------------------------------------------ */
/* Recall / narrative blocks / shared inventory                        */
/* ------------------------------------------------------------------ */

async function recall() {
    const actors = game.user.targets.size
        ? [...game.user.targets].map(t => t.actor)
        : canvas.tokens.controlled.map(t => t.actor);

    if (!actors.length) return ui.notifications.warn("Sélectionne ou cible le Pokémon rappelé dans sa Pokéball.");

    for (const actor of actors) {
        if (!actor) continue;
        const purged = await purgeOnRecall(actor);
        ui.notifications.info(purged.length
            ? `${actor.name} : statuts purgés — ${purged.join(", ")}`
            : `${actor.name} : aucun statut à purger.`);
    }
}

async function narrativeBlock() {
    if (!game.user.isGM) return ui.notifications.warn("Réservé au MJ.");

    const title = await prompt({
        title: "Ajouter un bloc de narration",
        content: field("Titre du bloc", `<input type="text" id="pe-block-title" value=""/>`),
        label: "Ajouter à tous les Dresseurs"
    }, (html) => html.find("#pe-block-title").val()?.trim());

    if (!title) return;

    const trainers = game.actors.filter(a => a.type === "character");
    if (!trainers.length) return ui.notifications.warn("Aucun Dresseur dans le monde.");

    let touched = 0;
    for (const actor of trainers) {
        const blocks = [...(actor.system.epopee?.narrative?.customBlocks ?? [])];
        if (blocks.some(b => b.title === title)) continue;
        blocks.push({ title, body: "" });
        await actor.update({ "system.epopee.narrative.customBlocks": blocks });
        touched++;
    }

    ui.notifications.info(`Bloc "${title}" ajouté à ${touched} Dresseur(s).`);
}

function sharedInventory() {
    new CONFIG.PTU.ui.sharedInventory.sheetClass().render(true);
}

export { environment, hazard, wall, travel, recall, narrativeBlock, sharedInventory };
