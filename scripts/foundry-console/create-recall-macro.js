const command = `
const { purgeOnRecall } = await import("/systems/ptu/src/module/statuses/engine.js");
const targets = game.user.targets.size ? [...game.user.targets].map(t => t.actor) : canvas.tokens.controlled.map(t => t.actor);
if (!targets.length) {
    ui.notifications.warn("Select or target the Pokemon being recalled to its Poke Ball.");
} else {
    for (const actor of targets) {
        const purged = await purgeOnRecall(actor);
        if (purged.length) ui.notifications.info(\`\${actor.name}: purged statuses - \${purged.join(", ")}\`);
        else ui.notifications.info(\`\${actor.name}: no status to purge.\`);
    }
}
`.trim();

const existing = game.macros.find(m => m.name === "Recall to Poke Ball" || m.name === "Rappel en Poke Ball");
if (existing) {
    await existing.update({ name: "Recall to Poke Ball", command });
    console.log("Macro updated: Recall to Poke Ball");
} else {
    await Macro.create({
        name: "Recall to Poke Ball",
        type: "script",
        img: "icons/svg/mystery-man.svg",
        command
    });
    console.log("Macro created: Recall to Poke Ball (drag it from the Macros window to your hotbar)");
}
