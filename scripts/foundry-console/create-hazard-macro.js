const command = `
const { placeHazard } = await import("/systems/ptu/src/module/environment/hazards.js");
const hazardOptions = ["sticky-web", "spikes", "toxic-spikes", "rock-trap", "sharp-trap"];

const target = [...game.user.targets][0]?.document ?? canvas.tokens.controlled[0]?.document;
if (!target) {
    ui.notifications.warn("Target or select a token to mark the tile where the hazard should be placed.");
} else {
    const content = \`
        <div class="form-group"><label>Hazard</label><select id="ptu-hazard-slug">
            \${hazardOptions.map(o => \`<option value="\${o}">\${o}</option>\`).join("")}
        </select></div>
        <p>Will be placed at \${target.name}'s current position (\${target.x}, \${target.y}).</p>
    \`;
    new Dialog({
        title: "Place Hazard",
        content,
        buttons: {
            place: {
                label: "Place",
                callback: async (html) => {
                    const slug = html.find("#ptu-hazard-slug").val();
                    await placeHazard(target.x, target.y, slug);
                    ui.notifications.info(\`Placed \${slug} at (\${target.x}, \${target.y}).\`);
                }
            }
        },
        default: "place"
    }).render(true);
}
`.trim();

const existing = game.macros.find(m => m.name === "Place Hazard");
if (existing) {
    await existing.update({ command });
    console.log("Macro updated: Place Hazard");
} else {
    await Macro.create({
        name: "Place Hazard",
        type: "script",
        img: "icons/svg/mystery-man.svg",
        command
    });
    console.log("Macro created: Place Hazard (drag it from the Macros window to your hotbar)");
}
