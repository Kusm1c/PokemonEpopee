import { WALL_DEFINITIONS } from "./definitions.js";

function wallTilesOnScene() {
    return canvas.scene?.tiles?.filter(t => t.flags.pe?.wallSlug) ?? [];
}

async function placeWall(x, y, slug, length = 1, extended = false) {
    const definition = WALL_DEFINITIONS[slug];
    if (!definition) return;

    await canvas.scene.createEmbeddedDocuments("Tile", [{
        x, y,
        width: canvas.grid.size * length,
        height: canvas.grid.size,
        texture: { src: "icons/svg/mystery-man.svg" },
        flags: { pe: { wallSlug: slug, wallRemaining: extended ? definition.extendedDuration : definition.duration } }
    }]);

    await ChatMessage.create({ content: `<p><strong>${definition.label}</strong> is placed on the field.</p>` });
}

async function tickWalls() {
    for (const tile of wallTilesOnScene()) {
        const remaining = (tile.flags.pe.wallRemaining ?? 1) - 1;
        const definition = WALL_DEFINITIONS[tile.flags.pe.wallSlug];
        if (remaining <= 0) {
            await tile.delete();
            await ChatMessage.create({ content: `<p><strong>${definition?.label ?? tile.flags.pe.wallSlug}</strong> crumbles.</p>` });
        } else {
            await tile.update({ "flags.pe.wallRemaining": remaining });
        }
    }
}

export { placeWall, tickWalls }
