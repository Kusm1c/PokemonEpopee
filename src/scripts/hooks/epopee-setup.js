import { runWorldSetup, SETUP_VERSION } from "../../module/setup/world-setup.js";

/**
 * Runs the Epopee world setup once per world, so a GM never has to paste a console
 * script to get the conditions, the Trap/Coat items or the shared inventory.
 *
 * Deliberately a separate `ready` hook rather than an addition to `Ready`: PTR's own
 * ready handler runs schema migrations, and a failure here must not be able to abort
 * those. Everything is wrapped so a broken step degrades to a warning.
 */
export const EpopeeSetup = {
    listen() {
        Hooks.once("ready", async () => {
            // Only a full GM can write to compendiums and create world actors. Assistants
            // are excluded on purpose - `isGM` would include them and the writes would
            // fail halfway through.
            if (!game.user.hasRole(CONST.USER_ROLES.GAMEMASTER)) return;

            let applied;
            try {
                applied = Number(game.settings.get("pe", "epopeeSetupVersion")) || 0;
            } catch {
                // Setting not registered yet (an older world loading newer code).
                return;
            }

            if (applied >= SETUP_VERSION) return;

            console.log(`PokemonEpopee | Running world setup (${applied} -> ${SETUP_VERSION})`);

            try {
                const log = await runWorldSetup();

                await game.settings.set("pe", "epopeeSetupVersion", SETUP_VERSION);

                if (log.length) {
                    for (const line of log) console.log("PokemonEpopee | " + line);
                    ui.notifications.info(
                        `Pokémon Épopée : configuration du monde terminée (${log.length} étape(s)). Détail dans la console.`,
                        { permanent: false }
                    );
                } else {
                    console.log("PokemonEpopee | World setup: nothing to do.");
                }
            } catch (error) {
                // The version is intentionally NOT bumped here, so the next load retries.
                console.error("PokemonEpopee | World setup failed:", error);
                ui.notifications.warn(
                    "Pokémon Épopée : la configuration automatique a échoué. Les scripts de scripts/foundry-console/ restent utilisables en secours.",
                    { permanent: true }
                );
            }
        });
    }
};
