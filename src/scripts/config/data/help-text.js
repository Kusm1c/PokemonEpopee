import { localize } from "../../../module/i18n.js";

export const helpText = {
    "Range": (range) => localize("PTU.Epopee.HelpText.Range", { range }),
    "Target": (target) => localize(target > 1 ? "PTU.Epopee.HelpText.Targets" : "PTU.Epopee.HelpText.Target", { target }),
    "DamageBase": (db) => localize("PTU.Epopee.HelpText.DamageBase", { db, dice: CONFIG.PTU.data.dbData[db] }),
    get "Priority"() { return localize("PTU.Epopee.HelpText.Priority"); }
}