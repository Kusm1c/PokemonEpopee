/**
 * Liked and disliked flavours, derived from a Pokemon's Nature.
 *
 * The design doc asks for "Gouts Preferes et Detestes (automatiques, dependant de sa
 * nature)" without supplying a table, because there isn't a separate one to supply: the
 * mapping is the long-standing series convention, one flavour per stat. A Nature raises
 * one stat and lowers another, so it likes the raised stat's flavour and dislikes the
 * lowered one's.
 *
 * PTR's `natureData` is `{ Name: [raisedStat, loweredStat] }` and, unlike the video
 * games, it includes HP. HP has no flavour, so a Nature touching it simply has no
 * preference on that side.
 *
 * Pure module - no Foundry globals - so `scripts/test-natures.mjs` can exercise it.
 */

/** One flavour per stat. HP is deliberately absent: it has none. */
const FLAVOUR_BY_STAT = {
    "Attack": "Spicy",
    "Defense": "Sour",
    "Speed": "Sweet",
    "Special Attack": "Dry",
    "Special Defense": "Bitter"
};

/**
 * Display labels for the sheet.
 *
 * Kept as a table rather than reusing the keys directly so that translating these later
 * is a one-line change here, not a hunt through the sheet templates.
 */
const FLAVOUR_LABELS = {
    "Spicy": "Spicy",
    "Sour": "Sour",
    "Sweet": "Sweet",
    "Dry": "Dry",
    "Bitter": "Bitter"
};

/**
 * @param {string} stat One of the keys of FLAVOUR_BY_STAT, or "HP"
 * @returns {string|null}
 */
function flavourForStat(stat) {
    const flavour = FLAVOUR_BY_STAT[stat];
    return flavour === undefined ? null : flavour;
}

/**
 * Resolve a Nature into its liked and disliked flavours.
 *
 * A "neutral" Nature - one that raises and lowers the same stat, which is how the
 * series expresses "no preference" - yields nulls on both sides.
 *
 * @param {string} natureName
 * @param {Record<string, [string, string]>} natureData Usually CONFIG.PTU.data.natureData
 * @returns {{liked: string|null, disliked: string|null, likedLabel: string|null, dislikedLabel: string|null, neutral: boolean}}
 */
function flavoursForNature(natureName, natureData) {
    const entry = natureData ? natureData[natureName] : undefined;
    const none = { liked: null, disliked: null, likedLabel: null, dislikedLabel: null, neutral: true };
    if (!Array.isArray(entry) || entry.length < 2) return none;

    const [raised, lowered] = entry;
    if (raised === lowered) return none;

    const liked = flavourForStat(raised);
    const disliked = flavourForStat(lowered);

    return {
        liked,
        disliked,
        likedLabel: liked ? FLAVOUR_LABELS[liked] : null,
        dislikedLabel: disliked ? FLAVOUR_LABELS[disliked] : null,
        neutral: !liked && !disliked
    };
}

/**
 * Short labels for the stats a Nature moves, for the dropdown.
 *
 * Deliberately abbreviated: the option text carries a name plus two stats, and the full
 * "Special Attack" pushes the line past the width of the select.
 */
const STAT_ABBREVIATIONS = {
    "HP": "HP",
    "Attack": "ATK",
    "Defense": "DEF",
    "Speed": "SPD",
    "Special Attack": "SPATK",
    "Special Defense": "SPDEF"
};

/**
 * Build the dropdown entries for the Nature select, each annotated with what it changes.
 *
 * The sheet used to hand `natureData` straight to `selectOptions` with
 * `labelAttr="value"`, so every option rendered its raw `[raised, lowered]` array and a
 * player had to know the table by heart to pick. Each option now reads
 * `Adamant (+ATQ / -ATS)`.
 *
 * A Nature that raises and lowers the same stat is the series' way of writing "no
 * change", so it is labelled as neutral rather than showing `+ATQ / -ATQ`.
 *
 * The option *value* stays the English name: it is what `system.nature.value` stores and
 * what the stat calculation looks up in `natureData`, so only the label is translated.
 *
 * @param {Record<string, [string, string]>} natureData Usually CONFIG.PTU.data.natureData
 * @returns {{value: string, label: string}[]} sorted by displayed name
 */
function natureOptions(natureData) {
    if (!natureData || typeof natureData !== "object") return [];

    const abbr = (stat) => STAT_ABBREVIATIONS[stat] ?? stat;

    return Object.entries(natureData)
        .map(([name, entry]) => {
            const nature = natureLabel(name);
            if (!Array.isArray(entry) || entry.length < 2) return { value: name, label: nature, nature };

            const [raised, lowered] = entry;
            const label = raised === lowered
                ? game.i18n.format("PTU.Epopee.NatureNeutral", { nature })
                : game.i18n.format("PTU.Epopee.NatureChange", {
                    nature,
                    raised: abbr(raised),
                    lowered: abbr(lowered)
                });

            return { value: name, label, nature };
        })
        // Sorted on the displayed name, so the list stays alphabetical once translated.
        .sort((a, b) => a.nature.localeCompare(b.nature, game.i18n.lang))
        .map(({ value, label }) => ({ value, label }));
}

/**
 * Marks a string the translators have yet to fill in. Shown as is, it would make the
 * six neutral Natures indistinguishable ("tradFR (Neutre)"), so it counts as missing.
 */
const UNTRANSLATED = "tradFR";

/**
 * A Nature's name in the current language, from `PTU.Epopee.Natures.<English name>`.
 * Falls back to the English name when there is no translation yet, so a Nature added
 * to `natureData` still shows up rather than as a raw key or a placeholder.
 *
 * @param {string} name English name, as stored on the actor
 * @returns {string}
 */
function natureLabel(name) {
    const key = `PTU.Epopee.Natures.${name}`;
    if (!game.i18n.has(key)) return name;
    const label = game.i18n.localize(key);
    return label && label !== UNTRANSLATED ? label : name;
}

export {
    FLAVOUR_BY_STAT,
    FLAVOUR_LABELS,
    STAT_ABBREVIATIONS,
    flavourForStat,
    flavoursForNature,
    natureLabel,
    natureOptions
};
