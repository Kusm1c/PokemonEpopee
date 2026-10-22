import { PTUSettingsMenu } from "./base.js";

const MetagameSettingsConfig = {
    "dexPermissions": {
        name: "PTU.Settings.Metagame.DexPermissions.Name",
        hint: "PTU.Settings.Metagame.DexPermissions.Hint",
        type: Number,
        choices: {
            1: "PTU.Epopee.Settings.DexPermissions.Disabled",
            2: "PTU.Epopee.Settings.DexPermissions.DescriptionOnly",
            3: "PTU.Epopee.Settings.DexPermissions.OwnedTokens",
            4: "PTU.Epopee.Settings.DexPermissions.OwnedMons",
            5: "PTU.Epopee.Settings.DexPermissions.GmPrompt",
            6: "PTU.Epopee.Settings.DexPermissions.Always",
        },
        default: 1
    },
    "alwaysShowCrits": {
        name: "PTU.Settings.Metagame.AlwaysShowCrits.Name",
        hint: "PTU.Settings.Metagame.AlwaysShowCrits.Hint",
        type: Boolean,
        default: false
    },
    "allowPlayersToEditSpecies": {
        name: "PTU.Settings.Metagame.AllowPlayersToEditSpecies.Name",
        hint: "PTU.Settings.Metagame.AllowPlayersToEditSpecies.Hint",
        type: Boolean,
        default: true
    }
}

export class MetagameSettings extends PTUSettingsMenu {
    static namespace = "metagame";

    static get settings() {
        return MetagameSettingsConfig;
    }

    static get SETTINGS() {
        return Object.keys(MetagameSettingsConfig);
    }
}