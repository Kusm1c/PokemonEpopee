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

/** For the sheet, in French, matching the rules text. */
const FLAVOUR_LABELS = {
    "Spicy": "Épicé",
    "Sour": "Acide",
    "Sweet": "Sucré",
    "Dry": "Sec",
    "Bitter": "Amer"
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

export { FLAVOUR_BY_STAT, FLAVOUR_LABELS, flavourForStat, flavoursForNature };
