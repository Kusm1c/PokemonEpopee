import { loadKeywordAliases } from "../../module/keywords/index.js";

/** Keyword spellings come from the locale files, so they load once those are read. */
export const KeywordHooks = {
    listen() {
        Hooks.once("i18nInit", () => loadKeywordAliases());
    }
};
