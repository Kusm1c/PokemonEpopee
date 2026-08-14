const command = `
const { startWeather, startField, clearWeather, clearField, toggleZone } = await import("/systems/ptu/src/module/environment/engine.js");
if (!game.combat) { ui.notifications.warn("No active combat."); }
else {
    const weatherOptions = ["sunny", "rainy", "sandstorm", "snowstorm", "mist"];
    const fieldOptions = ["electric", "misty", "grassy", "psychic"];
    const zoneOptions = ["plasma-flood", "distortion", "gravity", "magic-room", "wonder-room", "tailwind"];
    const activeZones = game.combat.flags.ptu?.zones ?? {};
    const content = \`
        <div class="form-group"><label>Weather</label><select id="ptu-env-weather">
            <option value="">(none)</option>
            \${weatherOptions.map(o => \`<option value="\${o}">\${o}</option>\`).join("")}
        </select></div>
        <div class="form-group"><label>Field</label><select id="ptu-env-field">
            <option value="">(none)</option>
            \${fieldOptions.map(o => \`<option value="\${o}">\${o}</option>\`).join("")}
        </select></div>
        <div class="form-group"><label><input type="checkbox" id="ptu-env-extended"/> Extended duration (Rock/Terrain Extender held)</label></div>
        <hr/>
        <p>Zones (stack, click to toggle on/off):</p>
        \${zoneOptions.map(o => \`<div class="form-group"><label><input type="checkbox" class="ptu-env-zone" value="\${o}" \${o in activeZones ? "checked" : ""}/> \${o}</label></div>\`).join("")}
    \`;
    new Dialog({
        title: "Set Weather / Field / Zones",
        content,
        buttons: {
            apply: {
                label: "Apply",
                callback: async (html) => {
                    const weather = html.find("#ptu-env-weather").val();
                    const field = html.find("#ptu-env-field").val();
                    const extended = html.find("#ptu-env-extended").is(":checked");
                    if (weather) await startWeather(game.combat, weather, extended); else await clearWeather(game.combat);
                    if (field) await startField(game.combat, field, extended); else await clearField(game.combat);

                    for (const el of html.find(".ptu-env-zone")) {
                        const slug = el.value;
                        const shouldBeActive = el.checked;
                        const isActive = slug in (game.combat.flags.ptu?.zones ?? {});
                        if (shouldBeActive !== isActive) await toggleZone(game.combat, slug);
                    }
                }
            }
        },
        default: "apply"
    }).render(true);
}
`.trim();

const existing = game.macros.find(m => m.name === "Set Weather / Field" || m.name === "Set Weather / Field / Zones");
if (existing) {
    await existing.update({ name: "Set Weather / Field / Zones", command });
    console.log("Macro updated: Set Weather / Field / Zones");
} else {
    await Macro.create({
        name: "Set Weather / Field / Zones",
        type: "script",
        img: "icons/svg/mystery-man.svg",
        command
    });
    console.log("Macro created: Set Weather / Field / Zones (drag it from the Macros window to your hotbar)");
}
