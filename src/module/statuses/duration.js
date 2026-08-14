function resolveDuration({ currentDuration, startDuration, durationTicks, effect }) {
    let value = currentDuration;

    if (durationTicks && value === -1 && typeof startDuration === "number") value = startDuration;
    if (durationTicks) value -= 1;
    if (typeof effect.durationDelta === "number") value += effect.durationDelta;
    if (effect.renewed) value = -1;
    if (effect.decayIfNotRenewed) value = currentDuration === -1 ? 2 : currentDuration - 1;

    const cured = value !== -1 && value <= 0;
    return { value, cured };
}

export { resolveDuration }
