function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuotes) {
            if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (char === '"') inQuotes = false;
            else field += char;
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ",") {
            row.push(field);
            field = "";
        } else if (char === "\n" || char === "\r") {
            if (char === "\r" && text[i + 1] === "\n") continue;
            row.push(field);
            field = "";
            if (row.length > 1 || row[0] !== "") rows.push(row);
            row = [];
        } else {
            field += char;
        }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
}

const input = document.createElement("input");
input.type = "file";
input.accept = ".csv";
input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    const header = rows.shift();
    const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

    const pack = game.packs.get("ptu.species");
    await pack.configure({ locked: false });
    const index = await pack.getIndex();

    let updated = 0, skipped = 0;
    for (const row of rows) {
        const slug = row[idx.slug]?.trim();
        if (!slug) continue;
        const entry = index.find(i => i.system?.slug === slug) ?? index.find(i => i.name === row[idx.name]);
        if (!entry) { console.warn(`Species not found for slug/name: ${slug}`); skipped++; continue; }

        const doc = await pack.getDocument(entry._id);
        await doc.update({
            "system.stats.hp": Number(row[idx.hp]) || 0,
            "system.stats.atk": Number(row[idx.atk]) || 0,
            "system.stats.def": Number(row[idx.def]) || 0,
            "system.stats.spatk": Number(row[idx.spatk]) || 0,
            "system.stats.spdef": Number(row[idx.spdef]) || 0,
            "system.stats.spd": Number(row[idx.spd]) || 0,
            "system.size.sizeClass": row[idx.sizeClass] ?? "",
            "system.size.weightClass": Number(row[idx.weightClass]) || 0
        });
        updated++;
    }

    ui.notifications.info(`Species spreadsheet import done: ${updated} updated, ${skipped} skipped.`);
    console.log(`Species spreadsheet import done: ${updated} updated, ${skipped} skipped.`);
};
input.click();
