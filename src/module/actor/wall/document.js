import { PTUActor } from "../base.js";
import { WALL_DEFINITIONS } from "../../environment/definitions.js";

/**
 * A wall (Protection, Mur Lumière...) placed on the battlefield.
 *
 * Walls are Actors rather than Tiles so that players can use them: only a GM can create,
 * move or delete a Tile, while every user owns a wall Actor. One Actor per wall, with one
 * linked token sized to the wall's length; see environment/walls.js.
 *
 * A wall has none of the data a Trainer or a Pokémon has (stats, moves, Spirit, level),
 * so every preparation step that reads it is switched off here.
 */
class PTUWallActor extends PTUActor {
    get canHostRuleElements() {
        return false;
    }

    get allowedItemTypes() {
        return [];
    }

    /** The base getter reads `system.modifiers`, which a wall does not have. */
    get types() {
        return ["Untyped"];
    }

    get definition() {
        return WALL_DEFINITIONS[this.system.wallSlug] ?? null;
    }

    /** The wall's name in the current user's language. */
    get wallLabel() {
        return this.definition?.label ?? this.name;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        // Neutral: a wall is nobody's ally or enemy, so it never counts towards flanking.
        this.system.alliance = null;
    }

    /** @override No stats, moves or Spirit to derive. */
    prepareDerivedData() { }

    /** @override Weather and other global effects do not apply to a wall. */
    prepareRuleElements() {
        return [];
    }

    /** @override A wall never takes a turn. */
    prepareInitiative() {
        return null;
    }

    /** @override The defaults are level-up point sources, which a wall has none of. */
    _setDefaultChanges() { }
}

export { PTUWallActor };
