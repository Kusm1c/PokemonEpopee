import { registerSocket } from "../../module/travel/socket.js";
import { activateJourneyCard } from "../../module/travel/journey.js";
import { syncTravelReference } from "../../module/travel/reference.js";
// Imported for its socket handlers: a player's client must be ready to answer a GM's
// Navigation request even though it never opens the macro itself.
import "../../module/travel/navigation.js";

export const Travel = {
    listen() {
        Hooks.once("ready", async () => {
            registerSocket();

            // Same rule as the macro sync: only a full GM writes world documents.
            if (!game.user.hasRole(CONST.USER_ROLES.GAMEMASTER)) return;
            try {
                const log = [];
                await syncTravelReference(log);
                for (const line of log) console.log("PokemonEpopee | " + line);
            } catch (error) {
                console.error("PokemonEpopee | Travel reference sync failed:", error);
            }
        });

        Hooks.on("renderChatMessageHTML", (message, html) => activateJourneyCard(message, html));
    }
};
