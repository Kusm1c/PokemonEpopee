const pack = game.packs.get("ptu.effects");
if (!pack) throw new Error("Compendium ptu.effects not found");

await pack.configure({ locked: false });
const index = await pack.getIndex();

async function setValueFields(name, { isValued, value }) {
    const entry = index.find(i => i.name === name);
    if (!entry) {
        console.warn(`Not found in compendium: ${name}`);
        return;
    }
    const doc = await pack.getDocument(entry._id);
    await doc.update({ "system.value.isValued": isValued, "system.value.value": value });
    console.log(`OK (updated): ${name}`);
}

async function createOrRenameCondition(name, folderName, { renameFrom } = {}) {
    const existing = index.find(i => i.name === name || (renameFrom && i.name === renameFrom));
    if (existing) {
        if (existing.name !== name) {
            const doc = await pack.getDocument(existing._id);
            await doc.update({ name });
            console.log(`OK (renamed ${existing.name} -> ${name})`);
        } else {
            console.log(`Already present, nothing to do: ${name}`);
        }
        return;
    }
    const folder = pack.folders?.find(f => f.name === folderName) ?? null;
    const [doc] = await pack.documentClass.createDocuments([{
        name,
        type: "condition",
        folder: folder?.id ?? null
    }], { pack: pack.collection });
    console.log(`OK (created): ${name}`);
    return doc;
}

await setValueFields("Poisoned", { isValued: true, value: 2 });
await setValueFields("Sleep", { isValued: true, value: 0 });

await createOrRenameCondition("Frostbite", "Conditions", { renameFrom: "Engelure" });
await createOrRenameCondition("Fear", "Conditions", { renameFrom: "Peur" });

console.log("Done. Check the lines above, everything should say OK.");
