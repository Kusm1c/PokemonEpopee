/**
 * Localisation with the translators' placeholder treated as missing.
 *
 * A string not yet translated is written "tradFR" in fr.json so the translators can find
 * it. Shown as is, every label would read "tradFR", so it falls back to the English
 * string - the same table Foundry itself falls back to for a missing key.
 */

const UNTRANSLATED = "tradFR";

/**
 * @param {string} key
 * @param {Record<string, unknown>} [data] values for `{name}` placeholders
 * @returns {string}
 */
function localize(key, data) {
    let text = game.i18n.localize(key);
    if (text === UNTRANSLATED) {
        const english = foundry.utils.getProperty(game.i18n._fallback ?? {}, key);
        text = typeof english === "string" ? english : key;
    }
    if (!data) return text;
    return text.replace(/{(\w+)}/g, (match, name) => (name in data ? String(data[name]) : match));
}

export { UNTRANSLATED, localize };
