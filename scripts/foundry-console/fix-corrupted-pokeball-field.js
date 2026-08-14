let fixed = 0;
for (const actor of game.actors) {
    if (actor.type !== "pokemon") continue;
    const value = actor.system.pokeball;
    if (typeof value !== "string") {
        console.log(`${actor.name}: pokeball is`, value, `(type: ${typeof value}, isArray: ${Array.isArray(value)})`);
        const repaired = Array.isArray(value) ? (value.find(v => typeof v === "string" && v.length) ?? "") : "";
        await actor.update({ "system.pokeball": repaired });
        console.log(`Fixed ${actor.name}: reset pokeball to "${repaired}"`);
        fixed++;
    }
}
console.log(`Done. Fixed ${fixed} actor(s). If 0 were fixed but the error persists, the corrupted actor might not be type "pokemon" or might need a hard refresh first.`);
