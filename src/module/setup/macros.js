/**
 * Macro definitions installed automatically by the world setup.
 *
 * These were previously pasted into the console one file at a time. Those scripts are
 * gone: the command bodies live here as the single source, installed by the world setup,
 * so a GM never touches F12 and the definitions cannot drift between two copies.
 *
 * `gmOnly` macros are still created for everyone - Foundry shows them, and the command
 * itself refuses to run for a player. That is how PTR's own GM macros behave.
 */

const EPOPEE_MACROS = [
    {
        key: "environment",
        name: "Set Weather / Field / Zones",
        img: "icons/svg/mystery-man.svg",
        gmOnly: false,
        command: `
const { startWeather, startField, clearWeather, clearField, toggleZone } = await import("/systems/ptu/src/module/environment/engine.js");
if (!game.combat) { ui.notifications.warn("No active combat."); }
else {
    const weatherOptions = ["sunny", "rainy", "sandstorm", "snowstorm", "mist"];
    const fieldOptions = ["electric", "misty", "grassy", "psychic"];
    const zoneOptions = ["plasma-flood", "distortion", "gravity", "magic-room", "wonder-room", "tailwind"];
    const activeZones = game.combat.flags.ptu?.zones ?? {};
    const content = \\\`
        <div class="form-group"><label>Weather</label><select id="ptu-env-weather">
            <option value="">(none)</option>
            \\\${weatherOptions.map(o => \\\`<option value="\\\${o}">\\\${o}</option>\\\`).join("")}
        </select></div>
        <div class="form-group"><label>Field</label><select id="ptu-env-field">
            <option value="">(none)</option>
            \\\${fieldOptions.map(o => \\\`<option value="\\\${o}">\\\${o}</option>\\\`).join("")}
        </select></div>
        <div class="form-group"><label><input type="checkbox" id="ptu-env-extended"/> Extended duration (Rock/Terrain Extender held)</label></div>
        <hr/>
        <p>Zones (stack, click to toggle on/off):</p>
        \\\${zoneOptions.map(o => \\\`<div class="form-group"><label><input type="checkbox" class="ptu-env-zone" value="\\\${o}" \\\${o in activeZones ? "checked" : ""}/> \\\${o}</label></div>\\\`).join("")}
    \\`
    },
    {
        key: "hazard",
        name: "Place Hazard",
        img: "icons/svg/mystery-man.svg",
        gmOnly: false,
        command: `
const { placeHazard } = await import("/systems/ptu/src/module/environment/hazards.js");
const hazardOptions = ["sticky-web", "spikes", "toxic-spikes", "rock-trap", "sharp-trap"];

const target = [...game.user.targets][0]?.document ?? canvas.tokens.controlled[0]?.document;
if (!target) {
    ui.notifications.warn("Target or select a token to mark the tile where the hazard should be placed.");
} else {
    const content = \\\`
        <div class="form-group"><label>Hazard</label><select id="ptu-hazard-slug">
            \\\${hazardOptions.map(o => \\\`<option value="\\\${o}">\\\${o}</option>\\\`).join("")}
        </select></div>
        <p>Will be placed at \\\${target.name}'s current position (\\\${target.x}, \\\${target.y}).</p>
    \\`
    },
    {
        key: "narrative-block",
        name: "Add Narrative Block (all Trainers)",
        img: "icons/svg/mystery-man.svg",
        gmOnly: true,
        command: `
if (!game.user.isGM) return ui.notifications.warn("GM only.");

const title = await Dialog.prompt({
    title: "Ajouter un bloc de narration",
    content: '<div class="form-group"><label>Titre du bloc</label><input type="text" id="ptu-block-title" value=""/></div>',
    label: "Ajouter à tous les Dresseurs",
    callback: (html) => html.find("#ptu-block-title").val()
}).catch(() => null);

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

ui.notifications.info(\\\`Bloc "\\\${title}" ajouté à \\\${touched} Dresseur(s).\\\`);
`
    },
    {
        key: "travel",
        name: "Advance Travel Quarter",
        img: "icons/svg/mystery-man.svg",
        gmOnly: false,
        command: `
const { advanceProgression } = await import("/systems/ptu/src/module/travel/engine.js");

const tables = game.tables.contents;
const tableOptions = tables.map(t => \\\`<option value="\\\${t.id}">\\\${t.name}</option>\\\`).join("");

const state = game.user.getFlag("ptu", "travelState") ?? { progressionKm: 0, thresholdKm: 6 };

const content = \\\`
    <p><strong>Current progression:</strong> \\\${state.progressionKm} / \\\${state.thresholdKm} km</p>
    <div class="form-group"><label>This Quarter's hex-exit threshold (change only if you just entered a new hex)</label><select id="ptu-travel-threshold">
        <option value="6" \\\${state.thresholdKm === 6 ? "selected" : ""}>Starting hex / near side / return (6km)</option>
        <option value="12" \\\${state.thresholdKm === 12 ? "selected" : ""}>Far side (12km)</option>
    </select></div>
    <div class="form-group"><label>Group speed (km/h, slowest member's Move / 2)</label><input type="number" id="ptu-travel-speed" value="3"/></div>
    <div class="form-group"><label>Rhythm/Travel Mode multiplier (1 = normal pace)</label><input type="number" id="ptu-travel-multiplier" value="1" step="0.1"/></div>
    <hr/>
    <div class="form-group"><label>Approach</label><select id="ptu-travel-approach">
        <option value="landmark">Landmark / route (auto, cannot get lost)</option>
        <option value="direction">Heading (Navigation check required)</option>
    </select></div>
    <div class="form-group"><label>Navigation bonus</label><input type="number" id="ptu-travel-bonus" value="0"/></div>
    <div class="form-group"><label>DC</label><input type="number" id="ptu-travel-dc" value="50"/></div>
    <div class="form-group"><label><input type="checkbox" id="ptu-travel-compass"/> Has a compass</label></div>
    <hr/>
    <div class="form-group"><label>Tracks table (rolled first)</label><select id="ptu-travel-tracks"><option value="">(none)</option>\\\${tableOptions}</select></div>
    <div class="form-group"><label>Lair table (rolled second)</label><select id="ptu-travel-lair"><option value="">(none)</option>\\\${tableOptions}</select></div>
    <div class="form-group"><label>Wandering/Landmark table (rolled third)</label><select id="ptu-travel-wandering"><option value="">(none)</option>\\\${tableOptions}</select></div>
\\`
    },
    {
        key: "wall",
        name: "Place Wall",
        img: "icons/svg/mystery-man.svg",
        gmOnly: false,
        command: `
const { placeWall } = await import("/systems/ptu/src/module/environment/walls.js");
const wallOptions = ["protect", "light-wall", "rune-protect", "fog-wall", "telekinesis-wall"];

const target = [...game.user.targets][0]?.document ?? canvas.tokens.controlled[0]?.document;
if (!target) {
    ui.notifications.warn("Target or select a token to mark where the wall starts.");
} else {
    const content = \\\`
        <div class="form-group"><label>Wall</label><select id="ptu-wall-slug">
            \\\${wallOptions.map(o => \\\`<option value="\\\${o}">\\\${o}</option>\\\`).join("")}
        </select></div>
        <div class="form-group"><label>Length (meters)</label><input type="number" id="ptu-wall-length" value="1" min="1"/></div>
        <div class="form-group"><label><input type="checkbox" id="ptu-wall-extended"/> Extended duration (Lumargile/Light Clay held)</label></div>
        <p>Will be placed at \\\${target.name}'s current position (\\\${target.x}, \\\${target.y}).</p>
    \\`
    },
    {
        key: "recall",
        name: "Recall to Poke Ball",
        img: "icons/svg/mystery-man.svg",
        gmOnly: false,
        command: `
const { purgeOnRecall } = await import("/systems/ptu/src/module/statuses/engine.js");
const targets = game.user.targets.size ? [...game.user.targets].map(t => t.actor) : canvas.tokens.controlled.map(t => t.actor);
if (!targets.length) {
    ui.notifications.warn("Sélectionne ou cible le Pokémon rappelé dans sa Pokéball.");
} else {
    for (const actor of targets) {
        const purged = await purgeOnRecall(actor);
        if (purged.length) ui.notifications.info(\`\${actor.name} : statuts purgés — \${purged.join(", ")}\`);
        else ui.notifications.info(\`\${actor.name} : aucun statut à purger.\`);
    }
}
`
    },
    {
        key: "shared-inventory",
        name: "Inventaire Partagé",
        img: "icons/svg/mystery-man.svg",
        gmOnly: false,
        command: `new CONFIG.PTU.ui.sharedInventory.sheetClass().render(true);`
    }
];

export { EPOPEE_MACROS };
