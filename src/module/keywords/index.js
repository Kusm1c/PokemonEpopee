/**
 * Keywords in any language.
 *
 * Keywords are free text, so a compendium tagged in French ("À distance") and one tagged
 * in English ("Ranged") used to be two different keywords to the code. Each keyword the
 * code cares about now has a key under `PTU.Epopee.Keywords` in the locale files, and
 * every string listed for it - in **every** language the system ships, not only the
 * player's - counts as that keyword:
 *
 *     en.json  "ranged-launching-distance": "Ranged"
 *     fr.json  "ranged-launching-distance": "À distance"
 *
 * A value may list several spellings separated by "|" ("Modéré|Modere"). Matching ignores
 * case, accents and spacing. To make the code recognise a new spelling, add it there.
 */

const KEYWORDS_PATH = "PTU.Epopee.Keywords";

/** normalised text -> keyword key */
const aliases = new Map();

/** "À  Distance" -> "a-distance" */
function normalizeKeyword(text) {
    return String(text ?? "")
        .normalize("NFD").replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function addAliases(table) {
    if (!table || typeof table !== "object") return;
    for (const [key, text] of Object.entries(table)) {
        aliases.set(normalizeKeyword(key), key);
        for (const spelling of String(text ?? "").split("|")) {
            const normalized = normalizeKeyword(spelling);
            // "tradFR" is the translators' placeholder, not a spelling.
            if (normalized && normalized !== "tradfr") aliases.set(normalized, key);
        }
    }
}

/**
 * Build the table from every language file. The loaded translations go in at once, the
 * other languages as soon as they are fetched.
 */
async function loadKeywordAliases() {
    addAliases(foundry.utils.getProperty(game.i18n._fallback ?? {}, KEYWORDS_PATH));
    addAliases(foundry.utils.getProperty(game.i18n.translations ?? {}, KEYWORDS_PATH));

    for (const language of game.system.languages ?? []) {
        try {
            const response = await fetch(`systems/${game.system.id}/${language.path}`);
            if (!response.ok) continue;
            addAliases(foundry.utils.getProperty(await response.json(), KEYWORDS_PATH));
        } catch (error) {
            console.warn(`PokemonEpopee | Could not read keywords from ${language.path}`, error);
        }
    }
}

/**
 * The keyword key a piece of text stands for, or null when it is no listed keyword.
 * @param {string} text
 * @returns {string|null}
 */
function keywordKey(text) {
    return aliases.get(normalizeKeyword(text)) ?? null;
}

/**
 * Whether a keyword list contains `key`, in any of its spellings. The key itself always
 * matches, so this also works before the tables are loaded.
 * @param {string[]} keywords
 * @param {string} key
 */
function hasKeyword(keywords, key) {
    if (!Array.isArray(keywords)) return false;
    const wanted = normalizeKeyword(key);
    return keywords.some((k) => keywordKey(k) === key || normalizeKeyword(k) === wanted);
}

export { KEYWORDS_PATH, normalizeKeyword, addAliases, loadKeywordAliases, keywordKey, hasKeyword };
