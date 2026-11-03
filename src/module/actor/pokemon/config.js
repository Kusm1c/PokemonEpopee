/**
 * Pokemon sheet limits and gates from the Epopee design doc.
 */

/** "4 max chacun (notif quand y'en a trop)" - Naturelles and Techniques each. */
const MAX_MOVES_PER_KIND = 4;

// Garde and Réaction are common moves now: their Loyalty thresholds (5 and 10) are set
// on the compendium entries ("Loyauté requise"), see src/module/moves/common.js.

/** "Split entre Objet Tenu et Objet Trouve (1 max de chaque)" */
const MAX_HELD_ITEMS_PER_SLOT = 1;

/**
 * "Il n'y a pas la limite de Statuts. Peut etre avoir une liste limitee a 3/3 comme les
 * moves/edge/features."
 *
 * Soft like MAX_MOVES_PER_KIND: going over is flagged, not blocked. A status is usually
 * inflicted on a Pokemon rather than chosen by its player, so a hard cap would mean
 * silently dropping an effect the GM just applied.
 */
const MAX_STATUSES = 3;

export {
    MAX_MOVES_PER_KIND,
    MAX_HELD_ITEMS_PER_SLOT,
    MAX_STATUSES
};
