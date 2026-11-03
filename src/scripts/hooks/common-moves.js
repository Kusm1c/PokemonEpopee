import { PACK_ID, loadCommonMoves } from "../../module/moves/common.js";

/**
 * Common moves come from the Moves compendium: read once the packs are available, and
 * again whenever an entry of that compendium changes, so a GM's edit shows on every sheet.
 */
export const CommonMoveHooks = {
    listen() {
        Hooks.once("ready", () => loadCommonMoves());
        for (const hook of ["createItem", "updateItem", "deleteItem"]) {
            Hooks.on(hook, (item) => {
                if (item.pack === PACK_ID) loadCommonMoves();
            });
        }
    }
};
