const command = `
const { advanceProgression } = await import("/systems/ptu/src/module/travel/engine.js");

const tables = game.tables.contents;
const tableOptions = tables.map(t => \`<option value="\${t.id}">\${t.name}</option>\`).join("");

const state = game.user.getFlag("ptu", "travelState") ?? { progressionKm: 0, thresholdKm: 6 };

const content = \`
    <p><strong>Current progression:</strong> \${state.progressionKm} / \${state.thresholdKm} km</p>
    <div class="form-group"><label>This Quarter's hex-exit threshold (change only if you just entered a new hex)</label><select id="ptu-travel-threshold">
        <option value="6" \${state.thresholdKm === 6 ? "selected" : ""}>Starting hex / near side / return (6km)</option>
        <option value="12" \${state.thresholdKm === 12 ? "selected" : ""}>Far side (12km)</option>
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
    <div class="form-group"><label>Tracks table (rolled first)</label><select id="ptu-travel-tracks"><option value="">(none)</option>\${tableOptions}</select></div>
    <div class="form-group"><label>Lair table (rolled second)</label><select id="ptu-travel-lair"><option value="">(none)</option>\${tableOptions}</select></div>
    <div class="form-group"><label>Wandering/Landmark table (rolled third)</label><select id="ptu-travel-wandering"><option value="">(none)</option>\${tableOptions}</select></div>
\`;

new Dialog({
    title: "Advance Travel Quarter",
    content,
    buttons: {
        roll: {
            label: "Roll Quarter",
            callback: async (html) => {
                const thresholdKm = Number(html.find("#ptu-travel-threshold").val());
                const speed = Number(html.find("#ptu-travel-speed").val()) || 0;
                const multiplier = Number(html.find("#ptu-travel-multiplier").val()) || 1;
                const approach = html.find("#ptu-travel-approach").val();
                const bonus = Number(html.find("#ptu-travel-bonus").val()) || 0;
                const dc = Number(html.find("#ptu-travel-dc").val()) || 50;
                const hasCompass = html.find("#ptu-travel-compass").is(":checked");

                const lines = [];

                const kmThisQuarter = speed * 4 * multiplier;
                const { newProgression, exited, overflowKm } = advanceProgression({
                    current: state.progressionKm,
                    thresholdKm,
                    kmThisQuarter
                });
                lines.push(\`Distance covered this Quarter: <strong>\${kmThisQuarter}km</strong>\`);
                if (exited) {
                    lines.push(\`<strong>The group exits the hex</strong> (overflow: \${overflowKm}km carried into the next hex). Pick the new hex's exit threshold next Quarter.\`);
                    await game.user.setFlag("ptu", "travelState", { progressionKm: overflowKm > thresholdKm ? 0 : overflowKm, thresholdKm });
                } else {
                    lines.push(\`Progression: \${newProgression} / \${thresholdKm}km\`);
                    await game.user.setFlag("ptu", "travelState", { progressionKm: newProgression, thresholdKm });
                }

                const halfHourRoll = await new Roll("1d8").evaluate();
                lines.push(\`Half-hour within the Quarter: <strong>\${halfHourRoll.total}</strong>\`);

                if (approach === "direction") {
                    const navRoll = await new Roll("1d100 + @bonus", { bonus }).evaluate();
                    const success = navRoll.total >= dc;
                    lines.push(\`Navigation check: \${navRoll.total} vs DC \${dc} - <strong>\${success ? "on course" : "LOST"}</strong>\`);
                    if (!success) {
                        if (hasCompass) {
                            lines.push("Compass automatically corrects the drift.");
                        } else {
                            const driftRoll = await new Roll("1d10").evaluate();
                            lines.push(\`Drift (1-10, lower = left, higher = right, adjust to your own drift diagram): <strong>\${driftRoll.total}</strong>\`);
                        }
                    }
                } else {
                    lines.push("Following a landmark/route: no chance of getting lost.");
                }

                async function rollTableIfSelected(selector, label) {
                    const id = html.find(selector).val();
                    if (!id) return;
                    const table = game.tables.get(id);
                    if (!table) return;
                    const draw = await table.draw({ displayChat: false });
                    const results = draw.results.map(r => r.getChatText?.() ?? r.text ?? r.name).join(", ");
                    lines.push(\`\${label} (\${table.name}): \${results || "no result"}\`);
                }

                await rollTableIfSelected("#ptu-travel-tracks", "Tracks check");
                await rollTableIfSelected("#ptu-travel-lair", "Lair check");
                await rollTableIfSelected("#ptu-travel-wandering", "Wandering/Landmark check");

                await ChatMessage.create({ content: \`<div><strong>Travel Quarter</strong><br/>\${lines.join("<br/>")}</div>\` });
            }
        }
    },
    default: "roll"
}).render(true);
`.trim();

const existing = game.macros.find(m => m.name === "Advance Travel Quarter");
if (existing) {
    await existing.update({ command });
    console.log("Macro updated: Advance Travel Quarter");
} else {
    await Macro.create({
        name: "Advance Travel Quarter",
        type: "script",
        img: "icons/svg/mystery-man.svg",
        command
    });
    console.log("Macro created: Advance Travel Quarter (drag it from the Macros window to your hotbar)");
}
