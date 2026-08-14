const WEATHER_DEFINITIONS = {
    sunny: {
        label: "Sunny",
        duration: 5,
        extendedDuration: 8,
        typeBoost: { type: "Fire", stageDelta: 2 },
        typePenalty: { type: "Water", stageDelta: -2 }
    },
    rainy: {
        label: "Rainy",
        duration: 5,
        extendedDuration: 8,
        typeBoost: { type: "Water", stageDelta: 2 },
        typePenalty: { type: "Fire", stageDelta: -2 }
    },
    sandstorm: {
        label: "Sandstorm",
        duration: 5,
        extendedDuration: 8,
        damageImmuneTypes: ["Rock", "Ground", "Steel"],
        damageFraction: 2,
        typeStageBonus: { type: "Rock", stat: "spdef", stageDelta: 2 }
    },
    snowstorm: {
        label: "Snowstorm",
        duration: 5,
        extendedDuration: 8,
        nonTypeStagePenalty: { exceptType: "Ice", stat: "spd", stageDelta: -2 },
        typeStageBonus: { type: "Ice", stat: "spdef", stageDelta: 2 }
    },
    mist: {
        label: "Mist",
        duration: 5,
        extendedDuration: 8,
        purgeStages: true
    }
}

const FIELD_DEFINITIONS = {
    electric: {
        label: "Electric Terrain",
        duration: 5,
        extendedDuration: 8,
        groundedOnly: true,
        sleepImmune: true,
        typeBoost: { type: "Electric", stageDelta: 2 }
    },
    misty: {
        label: "Misty Terrain",
        duration: 5,
        extendedDuration: 8,
        groundedOnly: true,
        purgeStatuses: true,
        typePenalty: { type: "Dragon", stageDelta: -2 }
    },
    grassy: {
        label: "Grassy Terrain",
        duration: 5,
        extendedDuration: 8,
        groundedOnly: true,
        healFraction: 2,
        typeBoost: { type: "Grass", stageDelta: 2 }
    },
    psychic: {
        label: "Psychic Terrain",
        duration: 5,
        extendedDuration: 8,
        groundedOnly: true,
        blocksInterruptReaction: true,
        typeBoost: { type: "Psychic", stageDelta: 2 }
    }
}

const ZONE_DEFINITIONS = {
    "plasma-flood": {
        label: "Plasma Flood",
        duration: 5,
        note: "All Normal-type moves become Electric-type. Not auto-applied: needs move-type resolution to be adjusted manually."
    },
    distortion: {
        label: "Distortion",
        duration: 5,
        note: "Reverses initiative order, including for the currently active turn. Not auto-applied: reorder the Combat Tracker manually."
    },
    gravity: {
        label: "Gravity",
        duration: 5,
        note: "Grounds all airborne/Levitating Pokemon, removes their Ground immunity, blocks air-only moves. Not auto-applied: adjudicate manually."
    },
    "magic-room": {
        label: "Magic Room",
        duration: 5,
        note: "Held Items cannot be used or activated. Not auto-applied: remind players manually."
    },
    "wonder-room": {
        label: "Wonder Room",
        duration: 5,
        note: "Swaps Defense and Special Defense for all Pokemon and Trainers. Not auto-applied: adjudicate manually."
    },
    tailwind: {
        label: "Tailwind",
        duration: 5,
        allyOnly: true,
        note: "Doubles Speed and initiative of allied Pokemon. Not auto-applied: adjudicate manually."
    }
}

const HAZARD_DEFINITIONS = {
    "sticky-web": {
        label: "Sticky Web",
        triggerRadius: 0,
        maxStacks: 1,
        oncePerTurn: true,
        stageDeltas: { spd: -1 }
    },
    spikes: {
        label: "Spikes",
        triggerRadius: 0,
        maxStacks: 3,
        hpDamageFractionPerStack: 1
    },
    "toxic-spikes": {
        label: "Toxic Spikes",
        triggerRadius: 0,
        maxStacks: 2,
        poisonIntensityPerStack: 1
    },
    "rock-trap": {
        label: "Rock Trap",
        triggerRadius: 3,
        maxStacks: 1,
        hpDamageFraction: 2,
        selfDestructs: true
    },
    "sharp-trap": {
        label: "Sharp Trap",
        triggerRadius: 0,
        maxStacks: 1,
        damageFormula: "7d10 + 28",
        selfDestructs: true,
        note: "Should also add the summoner's Special Attack as a Powerful move - not automated, no summoner-tracking exists yet."
    }
}

const WALL_DEFINITIONS = {
    protect: {
        label: "Protect",
        duration: 5,
        extendedDuration: 8,
        note: "Treats the Defense of allies behind it as +2 Combat Stage against moves passing through. Ignored by Critical Hits. Not auto-applied - adjudicate manually."
    },
    "light-wall": {
        label: "Light Wall",
        duration: 5,
        extendedDuration: 8,
        note: "Same as Protect but for Special Defense. Not auto-applied - adjudicate manually."
    },
    "rune-protect": {
        label: "Rune Protect",
        duration: 5,
        extendedDuration: 8,
        note: "Moves passing through cannot apply Status alterations to allies behind it. Ignored by Critical Hits. Not auto-applied - adjudicate manually."
    },
    "fog-wall": {
        label: "Fog Wall",
        duration: 5,
        extendedDuration: 8,
        note: "Moves targeting allies behind it get +3 AC if they have one. Not auto-applied - adjudicate manually."
    },
    "telekinesis-wall": {
        label: "Telekinesis Wall",
        duration: 5,
        extendedDuration: 8,
        note: "Same +3 AC effect as Fog Wall. Not auto-applied - adjudicate manually."
    }
}

export { WEATHER_DEFINITIONS, FIELD_DEFINITIONS, ZONE_DEFINITIONS, HAZARD_DEFINITIONS, WALL_DEFINITIONS }
