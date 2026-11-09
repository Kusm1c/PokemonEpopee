/**
 * Walls (Protection, Mur Lumière...): short-lived barriers on the battlefield.
 *
 * Each wall is an Actor of type "wall" that every user owns, with one linked token as long
 * as the wall. They used to be Tiles, which only a GM can create, move or delete, so the
 * players could not use them at all.
 *
 * Players still cannot create Actors or Tokens (Foundry keeps that for Assistants and up),
 * so a player's request goes through the system socket to the active GM's client, which
 * creates the wall for them. Only that GM counts the rounds down: every user owns the wall,
 * so letting each client do it would take a round off per connected player.
 */

import { WALL_DEFINITIONS } from "./definitions.js";
import { localize } from "../i18n.js";
import { emitSocket, onSocket } from "../travel/socket.js";

const DEFAULT_IMAGE_DIRECTORY = "systems/pe/static/images/walls";
/** The built-in images go from 1 to 5 squares; a longer wall stretches the 5. */
const DEFAULT_IMAGE_MAX_LENGTH = 5;
const IMAGE_EXTENSIONS = ["webp", "png", "svg", "jpg", "jpeg"];

/** The colour the generic (white) images are tinted with, per wall. */
const WALL_TINTS = {
    reflect: "#f6a5c0",
    "light-screen": "#ffe27a",
    "aurora-veil": "#86e3ec",
    "rune-protect": "#a6e7a8",
    mist: "#dbeeff",
    smokescreen: "#a3a8ad",
    telekinesis: "#c69cff"
};

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */

/** What the wall does, in the current user's language. */
function wallNote(slug) {
    const key = `PTU.Epopee.Setup.Wall.Notes.${slug}`;
    const text = localize(key);
    return text === key ? (WALL_DEFINITIONS[slug]?.note ?? "") : text;
}

function wallDuration(slug, extended = false) {
    const definition = WALL_DEFINITIONS[slug];
    if (!definition) return 0;
    return extended ? definition.extendedDuration : definition.duration;
}

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */

async function listFiles(directory) {
    try {
        const FilePicker = foundry.applications.apps.FilePicker.implementation;
        const result = await FilePicker.browse("data", directory);
        return result?.files ?? [];
    } catch (error) {
        console.warn(`PokemonEpopee | wall images: cannot read the folder "${directory}".`, error);
        return [];
    }
}

/** The first file whose name (without extension) is in `names`, in that order. */
function pickFile(files, names) {
    const byName = new Map();
    for (const file of files) {
        const base = decodeURIComponent(file.split("/").pop() ?? "");
        const dot = base.lastIndexOf(".");
        if (dot <= 0) continue;
        if (!IMAGE_EXTENSIONS.includes(base.slice(dot + 1).toLowerCase())) continue;
        const name = base.slice(0, dot).toLowerCase();
        if (!byName.has(name)) byName.set(name, file);
    }
    for (const name of names) {
        if (byName.has(name)) return byName.get(name);
    }
    return null;
}

/**
 * The image for a wall, looked up in the folder set in the system settings.
 *
 * In order: `<slug>-<length>`, `<slug>` (an image made for that wall, used as it is), then
 * `wall-<length>`, `wall` (a generic image, tinted with the wall's colour). Without any, the
 * system's own generic images are used.
 *
 * @returns {Promise<{src: string, tint: string}>}
 */
async function wallImage(slug, length) {
    const capped = Math.min(length, DEFAULT_IMAGE_MAX_LENGTH);
    const tint = WALL_TINTS[slug] ?? "#ffffff";
    const directory = String(game.settings.get("pe", "walls.imageDirectory") || DEFAULT_IMAGE_DIRECTORY)
        .trim()
        .replace(/\/+$/, "");

    const files = await listFiles(directory);
    const own = pickFile(files, [`${slug}-${length}`, `${slug}-${capped}`, slug]);
    if (own) return { src: own, tint: "#ffffff" };

    const generic = pickFile(files, [`wall-${length}`, `wall-${capped}`, "wall"]);
    return { src: generic ?? `${DEFAULT_IMAGE_DIRECTORY}/wall-${capped}.svg`, tint };
}

/* ------------------------------------------------------------------ */
/* Orientation                                                         */
/* ------------------------------------------------------------------ */

/**
 * Token data for a wall lying horizontally or vertically.
 *
 * Foundry can only rotate a token's image, not its footprint on the grid, so a vertical
 * wall is a 1 x length token turned 90 degrees. Its image is first scaled back to
 * length x 1 (the mesh is sized to the footprint, times the texture scale, then rotated),
 * so any image drawn for a horizontal wall shows upright, undistorted.
 */
function wallOrientation(length, vertical) {
    // lockRotation off: walls placed before they could turn had it on, which keeps the image still.
    return vertical
        ? { rotation: 90, lockRotation: false, width: 1, height: length, texture: { scaleX: length, scaleY: 1 / length } }
        : { rotation: 0, lockRotation: false, width: length, height: 1, texture: { scaleX: 1, scaleY: 1 } };
}

function isVerticalWall(token) {
    return ((((Number(token.rotation) || 0) % 180) + 180) % 180) === 90;
}

/**
 * The update that turns a wall when its rotation is changed, e.g. with Shift + mouse wheel.
 *
 * A wall only lies horizontally or vertically. A multiple of 90 degrees (typed in the token
 * settings) picks the matching one; any other step - a wheel notch - flips it. It pivots
 * on its first square, which keeps it on the grid.
 */
function wallRotationChanges(token, requested) {
    const length = Math.max(Number(token.width) || 1, Number(token.height) || 1);
    const angle = (((Number(requested) || 0) % 360) + 360) % 360;
    const vertical = angle % 90 === 0 ? (angle / 90) % 2 === 1 : !isVerticalWall(token);
    return wallOrientation(length, vertical);
}

/* ------------------------------------------------------------------ */
/* Placing                                                             */
/* ------------------------------------------------------------------ */

/** The Actor folder walls go in, created the first time. Found by flag, whatever its name. */
async function wallFolder() {
    const existing = game.folders.find((f) => f.type === "Actor" && f.getFlag("pe", "walls"));
    if (existing) return existing;
    return Folder.create({
        name: localize("PTU.Epopee.Environment.Walls.Folder"),
        type: "Actor",
        flags: { pe: { walls: true } }
    });
}

/** Creates the wall Actor and its token. Runs on a GM client. */
async function createWall({ sceneId, x, y, slug, length = 1, extended = false, vertical = false }) {
    const definition = WALL_DEFINITIONS[slug];
    const scene = game.scenes.get(sceneId);
    if (!definition || !scene) return null;

    length = Math.max(1, Math.floor(Number(length) || 1));
    const name = definition.label;
    const image = await wallImage(slug, length);
    const folder = await wallFolder();

    const actor = await Actor.create({
        name,
        type: "wall",
        img: image.src,
        folder: folder?.id ?? null,
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
        system: { wallSlug: slug, remaining: wallDuration(slug, extended), length, extended },
        prototypeToken: {
            name,
            actorLink: true,
            width: length,
            height: 1,
            texture: { src: image.src, tint: image.tint, fit: "fill" },
            disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
            displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
            displayBars: CONST.TOKEN_DISPLAY_MODES.NONE,
            bar1: { attribute: null },
            bar2: { attribute: null },
            // The image must follow the token's rotation for vertical walls.
            lockRotation: false,
            sight: { enabled: false },
            // linkToActorSize off, or the token would be shrunk to the actor's 1x1 size class.
            // wallName lets the nameplate show the wall in each viewer's own language.
            flags: { pe: { linkToActorSize: false, autoscale: false, wallName: name } }
        }
    });
    if (!actor) return null;

    const token = await actor.getTokenDocument({ x, y, ...wallOrientation(length, !!vertical) }, { parent: scene });
    await scene.createEmbeddedDocuments("Token", [token.toObject()]);

    await ChatMessage.create({ content: `<p>${localize("PTU.Epopee.Environment.Walls.Placed", { name })}</p>` });
    return actor;
}

/**
 * Places a wall at (x, y) on a scene: directly for a GM, through the active GM otherwise.
 *
 * @param {{sceneId?: string, x: number, y: number, slug: string, length?: number, extended?: boolean, vertical?: boolean}} request
 */
async function placeWall(request) {
    const data = { ...request, sceneId: request.sceneId ?? canvas.scene?.id };
    if (!WALL_DEFINITIONS[data.slug] || !data.sceneId) return;

    if (game.user.isGM) {
        await createWall(data);
        return;
    }
    if (!game.users.activeGM) {
        ui.notifications.warn(localize("PTU.Epopee.Setup.Wall.NoGm"));
        return;
    }
    emitSocket("walls.place", data);
    ui.notifications.info(localize("PTU.Epopee.Setup.Wall.Requested", { name: WALL_DEFINITIONS[data.slug].label }));
}

onSocket("walls.place", async (data) => {
    if (!game.users.activeGM?.isSelf) return;
    await createWall(data);
});

/* ------------------------------------------------------------------ */
/* Rounds and removal                                                  */
/* ------------------------------------------------------------------ */

function wallTokens(actor) {
    return game.scenes.contents.flatMap((scene) => scene.tokens.filter((t) => t.actorId === actor.id));
}

/** Removes a wall: its tokens on every scene, then the Actor itself. */
async function removeWall(actor) {
    const label = actor.wallLabel ?? actor.name;
    for (const token of wallTokens(actor)) {
        // Flagged so the deleteToken hook below leaves the Actor to us.
        await token.delete({ peWallRemoval: true });
    }
    await actor.delete();
    await ChatMessage.create({ content: `<p>${localize("PTU.Epopee.Environment.Walls.Crumbles", { name: label })}</p>` });
}

/** One round passes for every wall on the combat's scene. Active GM only. */
async function tickWalls(combat) {
    if (!game.users.activeGM?.isSelf) return;
    const scene = combat?.scene ?? canvas.scene;
    if (!scene) return;

    const actors = new Map();
    for (const token of scene.tokens) {
        if (token.actor?.type === "wall") actors.set(token.actor.id, token.actor);
    }
    for (const actor of actors.values()) {
        const remaining = (Number(actor.system.remaining) || 1) - 1;
        if (remaining <= 0) await removeWall(actor);
        else await actor.update({ "system.remaining": remaining });
    }

    // Walls placed as Tiles before walls became Actors.
    for (const tile of scene.tiles.filter((t) => t.flags.pe?.wallSlug)) {
        const remaining = (tile.flags.pe.wallRemaining ?? 1) - 1;
        const definition = WALL_DEFINITIONS[tile.flags.pe.wallSlug];
        if (remaining <= 0) {
            await tile.delete();
            await ChatMessage.create({ content: `<p>${localize("PTU.Epopee.Environment.Walls.Crumbles", { name: definition?.label ?? tile.flags.pe.wallSlug })}</p>` });
        } else {
            await tile.update({ "flags.pe.wallRemaining": remaining });
        }
    }
}

/** A wall token deleted by hand takes its Actor with it, once no other token uses it. */
async function onWallTokenDeleted(tokenDocument, options = {}) {
    if (options.peWallRemoval || !game.users.activeGM?.isSelf) return;
    const actor = game.actors.get(tokenDocument.actorId);
    if (actor?.type !== "wall") return;
    if (wallTokens(actor).length > 0) return;
    await actor.delete();
}

export { placeWall, tickWalls, onWallTokenDeleted, wallNote, wallDuration, wallRotationChanges, WALL_TINTS };
