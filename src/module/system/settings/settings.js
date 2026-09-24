/* -------------------------------------------- */
/*  System Setting Initialization               */
/* -------------------------------------------- */

import { MigrationRunner } from "../../migration/runner/index.js";
import { AutomationSettings } from "./automation.js";
import { GenerationSettings } from "./generation.js";
import { HomebrewSettings } from "./homebrew.js";
import { MetagameSettings } from "./metagame.js";
import { TypeSettings } from "./types.js";
import { VariantSettings } from "./variant.js";

export function registerSettings() {
    // // game.settings.register("pe", "errata", {
    // //     name: "PTU Errata",
    // //     hint: "The FVTT PTU System has been created using the latest Community Erratas in mind. If you would like to disable some of the errata's changes, specifically when it comes to automation, you can disable this option.",
    // //     scope: "world",
    // //     config: true,
    // //     type: Boolean,
    // //     default: true,
    // //     
    // //     onChange: debouncedReload
    // // });

    game.settings.registerMenu("pe", "variant", {
        name: "PTU.Settings.Variant.Name",
        label: "PTU.Settings.Variant.Label",
        hint: "PTU.Settings.Variant.Hint",
        icon: "fas fa-book",
        type: VariantSettings,
        restricted: true
    })
    VariantSettings.registerSettings();

    game.settings.registerMenu("pe", "automation", {
        name: "PTU.Settings.Automation.Name",
        label: "PTU.Settings.Automation.Label",
        hint: "PTU.Settings.Automation.Hint",
        icon: "fas fa-robot",
        type: AutomationSettings,
        restricted: true
    })
    AutomationSettings.registerSettings();

    game.settings.registerMenu("pe", "generation", {
        name: "PTU.Settings.Generation.Name",
        label: "PTU.Settings.Generation.Label",
        hint: "PTU.Settings.Generation.Hint",
        icon: "fas fa-dice-d20",
        type: GenerationSettings,
        restricted: true
    })
    GenerationSettings.registerSettings();

    game.settings.registerMenu("pe", "metagame", {
        name: "PTU.Settings.Metagame.Name",
        label: "PTU.Settings.Metagame.Label",
        hint: "PTU.Settings.Metagame.Hint",
        icon: "fas fa-gamepad",
        type: MetagameSettings,
        restricted: true
    });
    MetagameSettings.registerSettings();

    game.settings.registerMenu("pe", "homebrew", {
        name: "PTU.Settings.Homebrew.Name",
        label: "PTU.Settings.Homebrew.Label",
        hint: "PTU.Settings.Homebrew.Hint",
        icon: "fas fa-flask",
        type: HomebrewSettings,
        restricted: true
    });
    HomebrewSettings.registerSettings();

    game.settings.registerMenu("pe", "type", {
        name: "PTU.Settings.Type.Name",
        label: "PTU.Settings.Type.Label",
        hint: "PTU.Settings.Type.Hint",
        icon: "fas fa-shield-alt",
        type: TypeSettings,
        restricted: true
    })
    TypeSettings.registerSettings();

    game.settings.register("pe", "leagueBattle", {
        name: "League Battle Initiative",
        hint: "Sort player characters in inverted order before pokémon in combat.",
        scope: "world",
        config: false,  // Don't show in normal settings menu
        type: Boolean,
        default: false,
        onChange: async (value) => {
            // Reset and re-sort all active combats when the setting changes
            for (const combat of game.combats) {
                // Use resetAll() to clear all initiatives and trigger a re-sort
                // This is the same method used by the "Reset Initiative" button
                await combat.resetAll();
            }
        }
    });

    game.settings.register("pe", "skipRollDialog", {
        name: "Skip roll dialog",
        hint: "Skip the roll dialog and automatically roll the dice.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    })

    game.settings.register("pe", "autoRollDamage", {
        name: "Auto roll damage",
        hint: "Automatically roll damage when a move is used.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register("pe", "tokens.autoscale", {
        name: "Scale Tokens According to Size",
        hint: "If enabled, tokens will be scaled to 1.0 or (if belonging to a small creature) 0.6",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register("pe", "transferOwnershipDefaultValue", {
        name: "Transfer Ownership Preference",
        hint: "After ownership of a mon is transfered, would you like for it to also set default permissions for other players?",
        scope: "world",
        config: true,
        type: Number,
        choices: {
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE]: "None",
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED]: "Limited",
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER]: "Observer",
            [CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER]: "Owner"
        },
        default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE,
    })

    game.settings.register("pe", "captureDefaultPartyState", {
        name: "Capture Default Party State",
        hint: "When a pokemon is captured, should it be added to the party?",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "party": "Party",
            "box": "Box",
            "available": "Available"
        },
        default: "available"
    });
    
    game.settings.register("pe", "devMode", {
        name: "Development Mode",
        hint: "Enables certain behavior that is undesirable for normal play, but useful for development.",
        scope: "world",
        config: true,
        type: Boolean,
        requiresReload: true
    });

    game.settings.register("pe", "compendiumBrowserPacks", {
        name: "Compendium Browser Packs",
        hint: "Settings to exclude packs from loading.",
        scope: "world",
        config: false,
        default: {},
        type: Object,
        onChange: () => game.pe.compendiumBrowser.initCompendiumList()
    });

    game.settings.register("pe", "compendiumBrowserSources", {
        name: "Included Sources",
        hint: "Settings to display only entries with specified sources in the compendium browser.",
        scope: "world",
        config: false,
        default: {
            ignoreAsGM: true,
            showEmptySources: true,
            showUnknownSources: true,
            sources: {}
        },
        type: Object,
        onChange: () => {
            game.pe.compendiumBrowser.packLoader.reset();
            game.pe.compendiumBrowser.initCompendiumList();
        }
    });

    game.settings.register("pe", "worldNotesFolder", {
        name: "World Notes Folder ID",
        scope: "world",
        config: false,
        default: null,
        type: String,
    });

    game.settings.register("pe", "worldSystemVersion", {
        name: "World System Version",
        scope: "world",
        config: false,
        default: game.system.version,
        type: String,
    });

    game.settings.register("pe", "worldSchemaVersion", {
        name: "World Schema Version",
        hint: "Records the schema version for documents in the PTR system (don't modify this unless you know what you are doing).",
        scope: "world",
        config: true,
        default: MigrationRunner.MINIMUM_SAFE_VERSION,
        type: Number,
        requiresReload: true
    });

    // Epopee: records how far automatic world setup has been applied, so the conditions,
    // Trap/Coat items and shared inventory install themselves instead of being pasted
    // into the console. See src/module/setup/world-setup.js.
    game.settings.register("pe", "epopeeSetupVersion", {
        name: "Epopee Setup Version",
        hint: "Tracks which automatic setup steps have run in this world. Set to 0 to force the setup to run again.",
        scope: "world",
        config: true,
        default: 0,
        type: Number
    });

    game.settings.register("pe", "weatherEffects", {
        name: "Weather & Global Effects",
        scope: "world",
        config: false,
        default: [],
        type: Object,
        onChange: () => {
            game.pe.weather.updateGameState();
        }
    });


    // // game.settings.register("pe", "nonOwnerCanSeeTabs", {
    // //     name: "Non-owners can see Sheet Tabs",
    // //     hint: "Allow players with Limited/Observer permissions to browse tabs in a Pokémon/Trainer's full sheet",
    // //     scope: "world",
    // //     config: true,
    // //     type: Boolean,
    // //     default: false,
    // //     
    // // });

    // game.settings.register("pe", "pokeball-prompts", {
    //     name: "GM Setting: Request permission from GM when using Pokeballs",
    //     hint: "This will prompt the GM to allow or deny the use of a Pokeball or capturing a pokemon.",
    //     scope: "world",
    //     config: true,
    //     type: Number,
    //     choices: {
    //         1: "Always ask",
    //         2: "Only ask for capture",
    //         3: "Only ask for Pokéball throw",
    //         4: "Never Ask"
    //     },
    //     default: 1,
    //     
    // })

    // // game.settings.register("pe", "auto-add-to-dex", {
    // //     name: "Automatically add pokemon to Seen",
    // //     hint: "Automatically add pokemon to player's seen list when scanned with pokedex",
    // //     scope: "world",
    // //     config: true,
    // //     type: Boolean,
    // //     default: true,
    // //     
    // // });

    // game.settings.register("pe", "move-effectiveness-visible", {
    //     name: "Move Effectiveness",
    //     hint: "Whether the players will be able to see how effective their Pokémon's moves are",
    //     scope: "world",
    //     config: true,
    //     type: Number,
    //     choices: {
    //         1: "Disable Effectiveness",
    //         2: "Visible to GMs Only",
    //         3: "Visible on Seen Pokémon Only (Checks Pokédex)",
    //         4: "Visible on owned Pokémon Only (Checks Pokédex)",
    //         5: "Always Visible"
    //     },
    //     default: 1,
    //     
    // })

    // game.settings.register("pe", "removeVolatileConditionsAfterCombat", {
    //     name: "Remove Conditions after Combat",
    //     hint: "Automatically remove Volatile Conditions after Combat",
    //     scope: "world",
    //     config: true,
    //     type: Boolean,
    //     default: true,
    //     
    // });

    // // game.settings.register("pe", "ignoreVirtuosoLimit", {
    // //     name: "Ignore Virtuoso Limit",
    // //     hint: "Allow Skill Dice pool to go above 6 dice.",
    // //     scope: "world",
    // //     config: true,
    // //     type: Boolean,
    // //     default: false,
    // //     
    // // });

    // DO NOT DELETE THIS SETTING
    // They are required for backwards compatibility and importing of the old data
    game.settings.register("pe", "customSpeciesData", {
        name: "Custom Species Data",
        scope: "world",
        config: false,
        type: Object,
        default: {
            data: [],
            flags: {
                init: false,
                migrated: false
            }
        }
    });
    // DO NOT DELETE THIS SETTING
    // They are required for backwards compatibility and importing of the old data
    game.settings.register("pe", "customSpeciesBackup", {
        name: "Custom Species data backup",
        scope: "world",
        config: false,
        type: Object,
        default: []
    });

    //#region Animations & Sound
    // game.settings.register("pe", "typeEffectivenessCustomImageDirectory", {
    //     name: "Custom Type Image Directory",
    //     hint: "Directory from which Images for Custom Types are attempted to load. Looks for [CaseSensitiveTypeName]IC.webp.",
    //     scope: "world",
    //     config: true,
    //     type: String,
    //     default: "custom_types/",
    //     filePicker: true,
    //     
    // })

    // game.settings.register("pe", "enableMoveAnimations", {
    //     name: "Enable Move Animations",
    //     hint: "This will play an animated effect on the field between user and target tokens when moves are used. Requires the Sequencer module and JB2A's Animated Assets.",
    //     scope: "world",
    //     config: true,
    //     type: Boolean,
    //     default: true,
    //     
    // });

    // game.settings.register("pe", "dramaticTiming", {
    //     name: "Enable Dramatic... Timing!",
    //     hint: "This will delay pushing the results of a move to chat for a brief moment in order to reveal success or failure at the same time as its animation shows a hit or miss.",
    //     scope: "world",
    //     config: true,
    //     type: Boolean,
    //     default: true,
    //     
    // });

    // game.settings.register("pe", "playPokemonCriesOnDrop", {
    //     name: "Play Pokémon Cry when dragged from Dex and on turn start",
    //     hint: "This will play a Pokémon's cry when it is drag-and-dropped from the pokedex compendium, and in combat at the start of a Pokemon's turn.",
    //     scope: "world",
    //     config: true,
    //     type: Boolean,
    //     default: false,
    //     
    // });

    // game.settings.register("pe", "PokemonShinySound", {
    //     name: "Shiny Pokémon Sound Effect",
    //     hint: "The sound effect that will play when a shiny Pokémon is encountered.",
    //     scope: "world",
    //     config: true,
    //     type: String,
    //     choices: { //TODO: find sounds for let's go and sun/moon
    //         "": "None",
    //         "systems/pe/sounds/shiny_sparkles_sounds/Gen 2 Shiny Sparkles.mp3": "Gen 2 (Gold/Silver/Crystal)",
    //         "systems/pe/sounds/shiny_sparkles_sounds/Gen 3 Shiny Sparkles.mp3": "Gen 3 (Ruby/Sapphire/Emerald)",
    //         "systems/pe/sounds/shiny_sparkles_sounds/Gen 4 Shiny Sparkles.mp3": "Gen 4 (Diamond/Pearl/Platinum/Heart Gold/Soul Silver)",
    //         "systems/pe/sounds/shiny_sparkles_sounds/Gen 5 Shiny Sparkles.mp3": "Gen 5 (Black/White/Black 2/White 2)",
    //         "systems/pe/sounds/shiny_sparkles_sounds/Gen 6 Shiny Sparkles.mp3": "Gen 6 (X/Y/Omega Ruby/Alpha Sapphire)",
    //         //"systems/pe/sounds/shiny_sparkles_sounds/Gen 7 Shiny Sparkles.mp3": "Gen 7 (Sun/Moon/Ultra Sun/Ultra Moon)",
    //         "systems/pe/sounds/shiny_sparkles_sounds/Gen 8 Shiny Sparkles.mp3": "Gen 8 (Sword/Shield)",
    //         "systems/pe/sounds/shiny_sparkles_sounds/Gen 9 Shiny Sparkles.mp3": "Gen 9 (Scarlet/Violet)",
    //         "systems/pe/sounds/shiny_sparkles_sounds/legends-arceus-shiny-By-tuna.voicemod.net.mp3": "Legends Arceus",
    //         //"systems/pe/sounds/shiny_sparkles_sounds/": "Let's go Pikachu/Eevee",
    //     },
    //     default: 4,
    //     
    // })

    // game.settings.register("pe", "pokemonCryDirectory", {
    //     name: "Pokémon Cry Directory",
    //     hint: "The directory where the user can upload mp3 or wav files (named as the lowercase name of the pokémon).",
    //     scope: "world",
    //     config: true,
    //     type: String,
    //     default: "pokemon_cries/",
    //     filePicker: true,
    //     
    // });

    // game.settings.register("pe", "playMoveSounds", {
    //     name: "Play Move Sounds",
    //     hint: "This will play a move's sound effect when it's used.",
    //     scope: "world",
    //     config: true,
    //     type: Boolean,
    //     default: true,
    //     
    // });

    // game.settings.register("pe", "moveSoundDirectory", {
    //     name: "Move Sound Directory",
    //     hint: "The directory where the user can upload mp3 or wav files (named as the lowercase name of the move) to be used by scripts or modules.",
    //     scope: "world",
    //     config: true,
    //     type: String,
    //     default: "pokemon_sounds/",
    //     filePicker: true,
    //     
    // });

    // game.settings.register("pe", "usePokeballAnimationOnDragOut", {
    //     name: "Use an animated pokeball effect when dragging an owned pokemon onto a field with their trainer present.",
    //     hint: "Disable this if you are having problems with the effects.",
    //     scope: "world",
    //     config: true,
    //     type: Boolean,
    //     default: true
    // });

    // game.settings.register("pe", "useEvolutionAnimation", {
    //     name: "Use an animated evolution effect when a pokemon evolves.",
    //     hint: "Disable this if you are having problems with the effects.",
    //     scope: "world",
    //     config: true,
    //     type: Boolean,
    //     
    //     default: true
    // })

    // game.settings.register("pe", "usePokeballSoundsOnDragOut", {
    //     name: "Enable Pokéball Sounds.",
    //     hint: "Enable/Disable pokeball related sounds like when you send out a pokemon",
    //     scope: "client",
    //     config: true,
    //     type: Boolean,
    //     default: true
    // });
    //#endregion

    // Move Master Settings

    // game.settings.register("pe", "autoApplyInjuries", {
    //     name: "Auto-Apply Injuries",
    //     hint: "",
    //     scope: "world",
    //     config: true,
    //     type: String,
    //     choices: {
    //         "true": "Automatically Apply Injuries Upon Applying Damage",
    //         "false": "Don't Automatically Apply Injuries"
    //     },
    //     default: "true",
    //     
    // });

    // game.settings.register("pe", "currentWeather", {
    //     name: "Current Weather",
    //     hint: "This is usually set via internal scripts, but it's exposed here if you need to change it manually.",
    //     scope: "world",
    //     config: true,
    //     type: String,
    //     choices: {
    //         "Clear": "Clear",//"Clear Weather is the default weather, conferring no innate bonuses or penalties of any sort.",
    //         "Sunny": "Sunny",//"While Sunny, Fire-Type Attacks gain a +5 bonus to Damage Rolls, and Water-Type Attacks suffer a -5 Damage penalty.",
    //         "Rainy": "Rainy",//"While Rainy, Water-Type Attacks gain a +5 bonus to Damage Rolls, and Fire-Type Attacks suffer a -5 Damage penalty.",
    //         "Hail": "Hail",//"While it is Hailing, all non-Ice Type Pokémon lose a Tick of Hit Points at the beginning of their turn.",
    //         "Sandstorm": "Sandstorm"//"While it is Sandstorming, all non-Ground, Rock, or Steel Type Pokémon lose a Tick of Hit Points at the beginning of their turn.",
    //     },
    //     default: "Clear",
    //     
    // });

    game.settings.register("pe", "customItemIconDirectory", {
        name: "Custom Item Icons Directory",
        hint: "The directory where the user can upload item image files to be used for custom items. Must end with a /",
        scope: "world",
        config: false,
        type: String,
        default: "item_icons/",
        filePicker: true,

    });

    // Always leave homebrow options at the bottom:

    // game.settings.register("pe", "showMovementIcons", {
    //     name: "Show Movement Icons",
    //     hint: "Show movement icons above controlled tokens.",
    //     scope: "client",
    //     config: true,
    //     type: Boolean,
    //     default: true
    // })

    //#region AutoAnimations        
    game.settings.register("autoanimations", "playonDamageCore", {
        name: "Play Animation on Damage Rolls",
        hint: "Automatically play animations on damage rolls",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    })

    game.settings.register("autoanimations", "disableAEAnimations", {
        name: "Disable Active Effect Animations",
        hint: "Disable Active Effect Animations",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    })

    game.settings.register("autoanimations", "disableGrantedAuraEffects", {
        name: "Disable Granted Aura Effects",
        hint: "Disable Granted Aura Effects",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    })

    game.settings.register("autoanimations", "disableNestedEffects", {
        name: "Disable Nested Effects",
        hint: "Disable Nested Effects to save on performance",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    })
    //#endregion

}

export function SetAccessabilityFont(enabled) {
    if (enabled) {
        document.querySelector(':root').style.setProperty('--pkmnFontStyle', 'sans-serif')
    } else {
        document.querySelector(':root').style.setProperty('--pkmnFontStyle', 'Pokemon GB')
    }
}

const debouncedReload = foundry.utils.debounce(() => window.location.reload(), 100);