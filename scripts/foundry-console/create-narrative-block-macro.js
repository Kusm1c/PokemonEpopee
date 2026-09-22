// Creates a GM macro that adds one narrative text block to every Trainer at once.
// "Pouvoir facilement rajouter en tant que MJ des blocs a tout le monde."
const command = `
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

ui.notifications.info(\`Bloc "\${title}" ajouté à \${touched} Dresseur(s).\`);
`;

const macro = await Macro.create({
    name: "Add Narrative Block (all Trainers)",
    type: "script",
    scope: "global",
    img: "icons/svg/mystery-man.svg",
    command
});
console.log("Macro created:", macro.name);
