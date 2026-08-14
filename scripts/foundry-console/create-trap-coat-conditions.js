const TRAPS = [
    { name: "Secretion", duration: 5 },
    { name: "Time Howl", duration: 20 },
    { name: "Flame Dance", duration: 5 },
    { name: "Magma Vortex", duration: 5 },
    { name: "Free Fall", duration: 1 },
    { name: "Sand Tomb", duration: 5 },
    { name: "Ice Age", duration: 1 },
    { name: "Embrace", duration: 5 },
    { name: "Block", duration: 999 },
    { name: "Binding", duration: 5 },
    { name: "Clamp", duration: 5 },
    { name: "Siphon", duration: 5 },
    { name: "Spirit Lock", duration: 5 },
    { name: "Harassment", duration: 5 }
];

const COATS = [
    { name: "Fire Whirl" },
    { name: "Mud Throw" },
    { name: "Powder Cloud" },
    { name: "Roots" },
    { name: "Aurora Veil" },
    { name: "Mist Coat" },
    { name: "Power Coat" },
    { name: "Substitute" },
    { name: "Aqua Ring" }
];

const pack = game.packs.get("ptu.effects");
if (!pack) throw new Error("Compendium ptu.effects not found");

await pack.configure({ locked: false });
const index = await pack.getIndex();
const folder = pack.folders?.find(f => f.name === "Conditions") ?? null;

async function createCondition(name, durationValue) {
    const existing = index.find(i => i.name === name);
    if (existing) {
        console.log(`Already present, skipped: ${name}`);
        return;
    }
    const data = {
        name,
        type: "condition",
        folder: folder?.id ?? null
    };
    if (typeof durationValue === "number") {
        data.system = { duration: { value: durationValue, unit: "rounds", expiry: "turn-start" } };
    }
    await pack.documentClass.createDocuments([data], { pack: pack.collection });
    console.log(`Created: ${name}${typeof durationValue === "number" ? ` (duration ${durationValue})` : ""}`);
}

for (const trap of TRAPS) await createCondition(trap.name, trap.duration);
for (const coat of COATS) await createCondition(coat.name, undefined);

console.log("Done creating Trap/Coat conditions. Powder Cloud and Substitute need their intensity fields set manually (Powder Cloud: Intensity enabled, value 1).");
