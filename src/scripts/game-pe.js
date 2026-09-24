import * as EpopeeDialogs from "../module/setup/dialogs.js";
import { PokemonGenerator } from "../module/actor/pokemon/generator.js"
import { CompendiumBrowser } from "../module/apps/compendium-browser/index.js"
import { MigrationSummary } from "../module/apps/migration-summary.js"
import { TokenPanel } from "../module/apps/token-panel.js"
import { StatusEffects } from "../module/canvas/status-effect.js"
import { MigrationList } from "../module/migration/index.js"
import { MigrationRunner } from "../module/migration/runner/index.js"
import { EffectTracker } from "../module/system/effect-tracker.js"
import { getSpeciesData } from "../module/system/index.js"
import { findItemInCompendium, querySpeciesCompendium } from "../util/misc.js"
import { resolveInjectedProperties, resolveValue } from "../util/value-resolver.js"
import { dexSync } from "./macros/dex-sync.js"
import { pokedex } from "./macros/pokedex.js"
import { changeRotomForm } from "./macros/rotom-form-change.js"
import { TypeMatrix } from "../module/apps/type-matrix.js";
import { Weather } from "../module/apps/weather.js";
import { PTUPokemonTrainingSheet } from "../module/apps/pokemon-training/index.js";

const GamePTU = {
    onInit() {
        const initData = {
            species: {
                get: getSpeciesData,
                query: querySpeciesCompendium,
                generator: PokemonGenerator
            },
            item: {
                get: (name, type) => findItemInCompendium({ type, name }),
            },
            StatusEffects,
            forms: {
                massGenerator: undefined
            },
            effectTracker: new EffectTracker(),
            resolver: {
                resolveInjectedProperties,
                resolveValue
            },
            migration: {
                MigrationList,
                MigrationRunner,
                MigrationSummary
            },
            weather: Weather,
            pokemonTraining: PTUPokemonTrainingSheet,
            macros: {
                changeRotomForm,
                pokedex,
                dexSync,
                initializeWorldNotes: (async () => {
                    if (game.folders.getName("Actor Notes")) {
                        return game.settings.set("pe", "worldNotesFolder", game.folders.getName("Actor Notes").id)
                    }
        
                    const folder = await Folder.create({ name: "Actor Notes", type: "JournalEntry" });
                    return game.settings.set("pe", "worldNotesFolder", folder.id)
                }),
                openPokemonTraining: (actor) => {
                    if (!actor) {
                        if (game.user.character === null) {
                            ui.notifications.error("No Character was set for this user.", { localize: true });
                            return;
                        }
                        actor = game.user.character;
                    }
                    new PTUPokemonTrainingSheet({actor}).render(true);
                }
            },
            // Spread into a plain object on purpose. `import * as` yields a Module
            // Namespace Object, whose Symbol.toStringTag is "Module" - so Foundry's
            // getType() reports "Module", not "Object", and mergeObject throws
            // "One of original or other are not Objects!" the moment it recurses in.
            epopee: { ...EpopeeDialogs },
            tokenPanel: new TokenPanel()
        }

        // Assign the namespace BEFORE anything with side effects runs.
        //
        // `_initializeGlobalEffects` loads documents, and a single malformed one throws
        // out of onInit - which used to leave `game.pe` unassigned for the whole session.
        // Everything downstream (macros, sheets, user prepareData) then failed with
        // "Cannot read properties of undefined", hiding the real error behind a dozen
        // unrelated ones. One bad document should degrade one feature, not the namespace.
        game.pe = foundry.utils.mergeObject(game.pe ?? {}, initData)

        try {
            Weather._initializeGlobalEffects();
        } catch (error) {
            console.error("PokemonEpopee | Weather global effects failed to initialize:", error);
        }

        CONFIG.PTU.data.typeEffectiveness = game.settings.get("pe", "type.typeEffectiveness") ?? CONFIG.PTU.data.typeEffectiveness;
    },
    onSetup() {},
    onReady() {
        game.pe.compendiumBrowser = new CompendiumBrowser();
        game.pe.typeMatrix = new TypeMatrix()

        if (game.user.isGM) {
            if (!game.settings.get("pe", "worldNotesFolder")) {
                game.pe.macros.initializeWorldNotes();
            }
            // Else if necessary since initializeWorldNotes is async and we don't want to wait for it
            else if (game.folders.get(game.settings.get("pe", "worldNotesFolder")) === null) {
                game.pe.macros.initializeWorldNotes();
            }
        }

        // Reset pokemon that have reloadOnReady marked as true
        // This is due to having a temporary species override
        game.actors.filter(a => a.type === "pokemon" && a.reloadOnReady).forEach(a => a.reset())
    }
}

export { GamePTU }