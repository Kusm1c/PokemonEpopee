const STATUS_TIERS = [
    { id: "aucune", max: 50 },
    { id: "faible", max: 75 },
    { id: "moyenne", max: 100 },
    { id: "forte", max: 125 },
    { id: "tresForte", max: 150 },
    { id: "complete", max: Infinity }
];

const STATUS_RESISTANCE_SPEED_FRACTION = 0.25;
const STATUS_RESISTANCE_SCALES_WITH_STATUS_COUNT = false;
const STATUS_RESISTANCE_ASSIST_BONUS = 25;
const HP_FRAGMENT_DENOMINATOR = 20;

export {
    STATUS_TIERS,
    STATUS_RESISTANCE_SPEED_FRACTION,
    STATUS_RESISTANCE_SCALES_WITH_STATUS_COUNT,
    STATUS_RESISTANCE_ASSIST_BONUS,
    HP_FRAGMENT_DENOMINATOR
}
