/**
 * Pokemon sheet limits and gates from the Epopee design doc.
 */

/** "4 max chacun (notif quand y'en a trop)" - Naturelles and Techniques each. */
const MAX_MOVES_PER_KIND = 4;

/** "Action de Reaction (visuellement locked si le Pokemon est en-dessous de 5 de Loyaute)" */
const LOYALTY_REACTION = 5;

/** "Action de Protection (visuellement locked si le Pokemon est en-dessous de 10 de Loyaute)" */
const LOYALTY_PROTECTION = 10;

/** "Split entre Objet Tenu et Objet Trouve (1 max de chaque)" */
const MAX_HELD_ITEMS_PER_SLOT = 1;

export { MAX_MOVES_PER_KIND, LOYALTY_REACTION, LOYALTY_PROTECTION, MAX_HELD_ITEMS_PER_SLOT };
