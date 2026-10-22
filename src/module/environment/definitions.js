import { localize } from "../i18n.js";
const WEATHER_DEFINITIONS = {
    sunny: {
        get label() { return localize("PTU.Epopee.Environment.Weather.sunny"); },
        duration: 5,
        extendedDuration: 8,
        typeBoost: { type: "Fire", stageDelta: 2 },
        typePenalty: { type: "Water", stageDelta: -2 }
    },
    rainy: {
        get label() { return localize("PTU.Epopee.Environment.Weather.rainy"); },
        duration: 5,
        extendedDuration: 8,
        typeBoost: { type: "Water", stageDelta: 2 },
        typePenalty: { type: "Fire", stageDelta: -2 }
    },
    sandstorm: {
        get label() { return localize("PTU.Epopee.Environment.Weather.sandstorm"); },
        duration: 5,
        extendedDuration: 8,
        damageImmuneTypes: ["Rock", "Ground", "Steel"],
        damageFraction: 2,
        typeStageBonus: { type: "Rock", stat: "spdef", stageDelta: 2 }
    },
    snowstorm: {
        get label() { return localize("PTU.Epopee.Environment.Weather.snowstorm"); },
        duration: 5,
        extendedDuration: 8,
        nonTypeStagePenalty: { exceptType: "Ice", stat: "spd", stageDelta: -2 },
        typeStageBonus: { type: "Ice", stat: "spdef", stageDelta: 2 }
    },
    mist: {
        get label() { return localize("PTU.Epopee.Environment.Weather.mist"); },
        duration: 5,
        extendedDuration: 8,
        purgeStages: true
    }
}

const FIELD_DEFINITIONS = {
    electric: {
        get label() { return localize("PTU.Epopee.Environment.Field.electric"); },
        duration: 5,
        extendedDuration: 8,
        groundedOnly: true,
        sleepImmune: true,
        typeBoost: { type: "Electric", stageDelta: 2 }
    },
    misty: {
        get label() { return localize("PTU.Epopee.Environment.Field.misty"); },
        duration: 5,
        extendedDuration: 8,
        groundedOnly: true,
        purgeStatuses: true,
        typePenalty: { type: "Dragon", stageDelta: -2 }
    },
    grassy: {
        get label() { return localize("PTU.Epopee.Environment.Field.grassy"); },
        duration: 5,
        extendedDuration: 8,
        groundedOnly: true,
        healFraction: 2,
        typeBoost: { type: "Grass", stageDelta: 2 }
    },
    psychic: {
        get label() { return localize("PTU.Epopee.Environment.Field.psychic"); },
        duration: 5,
        extendedDuration: 8,
        groundedOnly: true,
        blocksInterruptReaction: true,
        typeBoost: { type: "Psychic", stageDelta: 2 }
    }
}

const ZONE_DEFINITIONS = {
    "plasma-flood": {
        get label() { return localize("PTU.Epopee.Environment.Zone.plasma-flood"); },
        duration: 5,
        note: "All Normal-type moves become Electric-type. Not auto-applied: needs move-type resolution to be adjusted manually."
    },
    distortion: {
        get label() { return localize("PTU.Epopee.Environment.Zone.distortion"); },
        duration: 5,
        note: "Reverses initiative order, including for the currently active turn. Not auto-applied: reorder the Combat Tracker manually."
    },
    gravity: {
        get label() { return localize("PTU.Epopee.Environment.Zone.gravity"); },
        duration: 5,
        note: "Grounds all airborne/Levitating Pokemon, removes their Ground immunity, blocks air-only moves. Not auto-applied: adjudicate manually."
    },
    "magic-room": {
        get label() { return localize("PTU.Epopee.Environment.Zone.magic-room"); },
        duration: 5,
        note: "Held Items cannot be used or activated. Not auto-applied: remind players manually."
    },
    "wonder-room": {
        get label() { return localize("PTU.Epopee.Environment.Zone.wonder-room"); },
        duration: 5,
        note: "Swaps Defense and Special Defense for all Pokemon and Trainers. Not auto-applied: adjudicate manually."
    },
    tailwind: {
        get label() { return localize("PTU.Epopee.Environment.Zone.tailwind"); },
        duration: 5,
        allyOnly: true,
        note: "Doubles Speed and initiative of allied Pokemon. Not auto-applied: adjudicate manually."
    }
}

const HAZARD_DEFINITIONS = {
    "sticky-web": {
        get label() { return localize("PTU.Epopee.Environment.Hazard.sticky-web"); },
        triggerRadius: 0,
        maxStacks: 1,
        oncePerTurn: true,
        stageDeltas: { spd: -1 }
    },
    spikes: {
        get label() { return localize("PTU.Epopee.Environment.Hazard.spikes"); },
        triggerRadius: 0,
        maxStacks: 3,
        hpDamageFractionPerStack: 1
    },
    "toxic-spikes": {
        get label() { return localize("PTU.Epopee.Environment.Hazard.toxic-spikes"); },
        triggerRadius: 0,
        maxStacks: 2,
        poisonIntensityPerStack: 1
    },
    "rock-trap": {
        get label() { return localize("PTU.Epopee.Environment.Hazard.rock-trap"); },
        triggerRadius: 3,
        maxStacks: 1,
        hpDamageFraction: 2,
        selfDestructs: true
    },
    "sharp-trap": {
        get label() { return localize("PTU.Epopee.Environment.Hazard.sharp-trap"); },
        triggerRadius: 0,
        maxStacks: 1,
        damageFormula: "7d10 + 28",
        selfDestructs: true,
        note: "Should also add the summoner's Special Attack as a Powerful move - not automated, no summoner-tracking exists yet."
    }
}

const WALL_DEFINITIONS = {
    protect: {
        get label() { return localize("PTU.Epopee.Environment.Wall.protect"); },
        duration: 5,
        extendedDuration: 8,
        note: "Treats the Defense of allies behind it as +2 Combat Stage against moves passing through. Ignored by Critical Hits. Not auto-applied - adjudicate manually."
    },
    "light-wall": {
        get label() { return localize("PTU.Epopee.Environment.Wall.light-wall"); },
        duration: 5,
        extendedDuration: 8,
        note: "Same as Protect but for Special Defense. Not auto-applied - adjudicate manually."
    },
    "rune-protect": {
        get label() { return localize("PTU.Epopee.Environment.Wall.rune-protect"); },
        duration: 5,
        extendedDuration: 8,
        note: "Moves passing through cannot apply Status alterations to allies behind it. Ignored by Critical Hits. Not auto-applied - adjudicate manually."
    },
    "fog-wall": {
        get label() { return localize("PTU.Epopee.Environment.Wall.fog-wall"); },
        duration: 5,
        extendedDuration: 8,
        note: "Moves targeting allies behind it get +3 AC if they have one. Not auto-applied - adjudicate manually."
    },
    "telekinesis-wall": {
        get label() { return localize("PTU.Epopee.Environment.Wall.telekinesis-wall"); },
        duration: 5,
        extendedDuration: 8,
        note: "Same +3 AC effect as Fog Wall. Not auto-applied - adjudicate manually."
    }
}

export { WEATHER_DEFINITIONS, FIELD_DEFINITIONS, ZONE_DEFINITIONS, HAZARD_DEFINITIONS, WALL_DEFINITIONS }
