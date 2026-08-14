const pack = game.packs.get("ptu.species");
if (!pack) throw new Error("Compendium ptu.species not found");

const docs = await pack.getDocuments();
const header = ["slug", "name", "hp", "atk", "def", "spatk", "spdef", "spd", "sizeClass", "weightClass"];
const rows = [header.join(",")];

for (const doc of docs.sort((a, b) => a.name.localeCompare(b.name))) {
    const s = doc.system;
    rows.push([
        doc.slug,
        `"${doc.name.replaceAll('"', '""')}"`,
        s.stats?.hp ?? 0,
        s.stats?.atk ?? 0,
        s.stats?.def ?? 0,
        s.stats?.spatk ?? 0,
        s.stats?.spdef ?? 0,
        s.stats?.spd ?? 0,
        s.size?.sizeClass ?? "",
        s.size?.weightClass ?? 0
    ].join(","));
}

const csv = rows.join("\n");
const blob = new Blob([csv], { type: "text/csv" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = "ptu-species-stats.csv";
link.click();
URL.revokeObjectURL(url);

console.log(`Exported ${docs.length} species to ptu-species-stats.csv`);
