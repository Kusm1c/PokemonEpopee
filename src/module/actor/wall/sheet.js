import { WALL_DEFINITIONS } from "../../environment/definitions.js";
import { wallNote } from "../../environment/walls.js";

/** A wall's sheet: its name, image, which wall it is, the rounds it has left, and what it does. */
class PTUWallSheet extends foundry.appv1.sheets.ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["pe", "sheet", "actor", "wall"],
            template: "systems/pe/static/templates/actor/wall-sheet.hbs",
            width: 420,
            height: "auto",
            submitOnChange: true,
            submitOnClose: true
        });
    }

    async getData(options) {
        const data = await super.getData(options);
        const slug = this.actor.system.wallSlug;
        return {
            ...data,
            walls: Object.entries(WALL_DEFINITIONS).map(([value, definition]) => ({
                value,
                label: definition.label,
                selected: value === slug
            })),
            note: wallNote(slug)
        };
    }
}

export { PTUWallSheet };
