export const statusEffects = [
    {
        "id": "fainted",
        "name": "PTU.ConditionFainted",
        "img": "systems/pe/static/images/conditions/Fainted.svg",
        "changes": [
            {
                "key": "flags.pe.is_fainted",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_vulnerable",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "burned",
        "name": "PTU.ConditionBurned",
        "img": "systems/pe/static/images/conditions/Burned.svg",
        "changes": [
            {
                "key": "flags.pe.is_burned",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "system.stats.def.stage.mod",
                "value": -2,
                "mode": 2,
                "priority": 10
            }
        ]
    },
    {
        "id": "frozen",
        "name": "PTU.ConditionFrozen",
        "img": "systems/pe/static/images/conditions/Frozen.svg",
        "changes": [
            {
                "key": "flags.pe.is_frozen",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_vulnerable",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "paralysis",
        "name": "PTU.ConditionParalysis",
        "img": "systems/pe/static/images/conditions/Paralysis.svg",
        "changes": [
            {
                "key": "flags.pe.is_paralyzed",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "poisoned",
        "name": "PTU.ConditionPoisoned",
        "img": "systems/pe/static/images/conditions/Poisoned.svg",
        "changes": [
            {
                "key": "flags.pe.is_poisoned",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "badly-poisoned",
        "name": "PTU.ConditionBadlyPoisoned",
        "img": "systems/pe/static/images/conditions/Badly-Poisoned.svg",
        "changes": [
            {
                "key": "flags.pe.is_poisoned",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_badly_poisoned",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "confused",
        "name": "PTU.ConditionConfused",
        "img": "systems/pe/static/images/conditions/Confused.svg",
        "changes": [
            {
                "key": "flags.pe.is_confused",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "cursed",
        "name": "PTU.ConditionCursed",
        "img": "systems/pe/static/images/conditions/Cursed.svg",
        "changes": [
            {
                "key": "flags.pe.is_cursed",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "disabled",
        "name": "PTU.ConditionDisabled",
        "img": "systems/pe/static/images/conditions/Disabled.svg",
        "changes": [
            {
                "key": "flags.pe.is_disabled",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "flinch",
        "name": "PTU.ConditionFlinch",
        "img": "systems/pe/static/images/conditions/Flinched.svg",
        "changes": [
            {
                "key": "flags.pe.is_vulnerable",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_flinched",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "infatuation",
        "name": "PTU.ConditionInfatuation",
        "img": "systems/pe/static/images/conditions/Infatuated.svg",
        "changes": [
            {
                "key": "flags.pe.is_infatuated",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "rage",
        "name": "PTU.ConditionRage",
        "img": "systems/pe/static/images/conditions/Rage.svg",
        "changes": [
            {
                "key": "flags.pe.is_raging",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "sleep",
        "name": "PTU.ConditionSleep",
        "img": "systems/pe/static/images/conditions/Sleep.svg",
        "changes": [
            {
                "key": "flags.pe.is_sleeping",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_vulnerable",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "bad-sleep",
        "name": "PTU.ConditionBadSleep",
        "img": "systems/pe/static/images/conditions/Bad-Sleep.svg",
        "changes": [
            {
                "key": "flags.pe.is_badly_sleeping",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "suppressed",
        "name": "PTU.ConditionSuppressed",
        "img": "systems/pe/static/images/conditions/Suppressed.svg",
        "changes": [
            {
                "key": "flags.pe.is_suppressed",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "blindness",
        "name": "PTU.ConditionBlindness",
        "img": "systems/pe/static/images/conditions/Blindness.svg",
        "changes": [
            {
                "key": "flags.pe.is_blind",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_vulnerable",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "system.modifiers.acBonus.mod",
                "value": -6,
                "mode": 2,
                "priority": 30
            }
        ]
    },
    {
        "id": "total-blindness",
        "name": "PTU.ConditionTotalBlindness",
        "img": "systems/pe/static/images/conditions/Total-Blindness.svg",
        "changes": [
            {
                "key": "flags.pe.is_blind",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_totally_blind",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_vulnerable",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "system.modifiers.acBonus.mod",
                "value": -10,
                "mode": 2,
                "priority": 30
            }
        ]
    },
    {
        "id": "slowed",
        "name": "PTU.ConditionSlowed",
        "img": "systems/pe/static/images/conditions/Slowed.svg",
        "changes": [
            {
                "key": "flags.pe.is_slowed",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "stuck",
        "name": "PTU.ConditionStuck",
        "img": "systems/pe/static/images/conditions/Stuck.svg",
        "changes": [
            {
                "key": "flags.pe.is_stuck",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "trapped",
        "name": "PTU.ConditionTrapped",
        "img": "systems/pe/static/images/conditions/Trapped.svg",
        "changes": [
            {
                "key": "flags.pe.is_trapped",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "tripped",
        "name": "PTU.ConditionTripped",
        "img": "systems/pe/static/images/conditions/Tripped.svg",
        "changes": [
            {
                "key": "flags.pe.is_tripped",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_vulnerable",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "vulnerable",
        "name": "PTU.ConditionVulnerable",
        "img": "systems/pe/static/images/conditions/Vulnerable.svg",
        "changes": [
            {
                "key": "flags.pe.is_vulnerable",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "tagged",
        "name": "PTU.ConditionTagged",
        "img": "systems/pe/static/images/conditions/Tagged.svg",
        "changes": [
            {
                "key": "flags.pe.is_tagged",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "cheered",
        "name": "PTU.ConditionCheered",
        "img": "systems/pe/static/images/conditions/Cheered.svg",
        "changes": [
            {
                "key": "flags.pe.is_cheered",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "vortex",
        "name": "PTU.ConditionVortex",
        "img": "systems/pe/static/images/conditions/Vortex.svg",
        "changes": [
            {
                "key": "flags.pe.is_stuck_in_vortex",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_slowed",
                "value": true,
                "mode": 5,
                "priority": 50
            },
            {
                "key": "flags.pe.is_trapped",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    },
    {
        "id": "seeded",
        "name": "PTU.ConditionSeeded",
        "img": "systems/pe/static/images/conditions/Seeded.svg",
        "changes": [
            {
                "key": "flags.pe.is_seeded",
                "value": true,
                "mode": 5,
                "priority": 50
            }
        ]
    }
];