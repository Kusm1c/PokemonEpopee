import { PTUItemSheet } from "../index.js";

class PTUMoveSheet extends PTUItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            template: "systems/pe/static/templates/item/move-sheet.hbs"
        });
    }

    /** @override */
    async getData() {
        const data = await super.getData();
        
        data.types = Object.keys(CONFIG.PTU.data.typeEffectiveness)
        if(!game.settings.get("pe", "homebrew.nuclearType")) data.types = data.types.filter(type => type != "Nuclear");
        if(!game.settings.get("pe", "homebrew.shadowType")) data.types = data.types.filter(type => type != "Shadow");

        return data;
    }
}

export { PTUMoveSheet }