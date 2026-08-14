const command = `
const { placeWall } = await import("/systems/ptu/src/module/environment/walls.js");
const wallOptions = ["protect", "light-wall", "rune-protect", "fog-wall", "telekinesis-wall"];

const target = [...game.user.targets][0]?.document ?? canvas.tokens.controlled[0]?.document;
if (!target) {
    ui.notifications.warn("Target or select a token to mark where the wall starts.");
} else {
    const content = \`
        <div class="form-group"><label>Wall</label><select id="ptu-wall-slug">
            \${wallOptions.map(o => \`<option value="\${o}">\${o}</option>\`).join("")}
        </select></div>
        <div class="form-group"><label>Length (meters)</label><input type="number" id="ptu-wall-length" value="1" min="1"/></div>
        <div class="form-group"><label><input type="checkbox" id="ptu-wall-extended"/> Extended duration (Lumargile/Light Clay held)</label></div>
        <p>Will be placed at \${target.name}'s current position (\${target.x}, \${target.y}).</p>
    \`;
    new Dialog({
        title: "Place Wall",
        content,
        buttons: {
            place: {
                label: "Place",
                callback: async (html) => {
                    const slug = html.find("#ptu-wall-slug").val();
                    const length = Number(html.find("#ptu-wall-length").val()) || 1;
                    const extended = html.find("#ptu-wall-extended").is(":checked");
                    await placeWall(target.x, target.y, slug, length, extended);
                }
            }
        },
        default: "place"
    }).render(true);
}
`.trim();

const existing = game.macros.find(m => m.name === "Place Wall");
if (existing) {
    await existing.update({ command });
    console.log("Macro updated: Place Wall");
} else {
    await Macro.create({
        name: "Place Wall",
        type: "script",
        img: "icons/svg/mystery-man.svg",
        command
    });
    console.log("Macro created: Place Wall (drag it from the Macros window to your hotbar)");
}
