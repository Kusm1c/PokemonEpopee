import { tickEnvironment } from "../../module/environment/engine.js";
import { checkHazardTrigger } from "../../module/environment/hazards.js";
import { onWallTokenDeleted, tickWalls } from "../../module/environment/walls.js";

export const Environment = {
    listen() {
        Hooks.on("updateCombat", async (combat, changed) => {
            if (!("round" in changed)) return;
            if (changed.round <= 1) return;
            await tickEnvironment(combat);
            await tickWalls(combat);
        });

        Hooks.on("deleteToken", async (tokenDocument, options) => {
            await onWallTokenDeleted(tokenDocument, options);
        });

        Hooks.on("updateToken", async (tokenDocument, changed) => {
            if (!("x" in changed) && !("y" in changed)) return;
            await checkHazardTrigger(tokenDocument);
        });

        Hooks.on("createToken", async (tokenDocument) => {
            await checkHazardTrigger(tokenDocument);
        });
    }
}
