/**
 * Macro definitions installed automatically by the world setup.
 *
 * Every command is a single call into `src/module/setup/dialogs.js`. That is deliberate:
 * these bodies used to hold the dialog source as JavaScript inside a template literal
 * inside another template literal, and one repo-wide find/replace silently ate a level
 * of escaping and broke the file. With one-line commands there is no JS-inside-a-string
 * left to corrupt, and the dialogs are ordinary modules that tooling can read.
 *
 * `gmOnly` macros are still created for everyone — Foundry lists them, and the dialog
 * itself refuses to run for a player. That matches how PTR's own GM macros behave.
 */

const EPOPEE_MACROS = [
    {
        key: "environment",
        name: "Set Weather / Field / Zones",
        img: "icons/svg/mystery-man.svg",
        gmOnly: true,
        command: "game.pe.epopee.environment();"
    },
    {
        key: "hazard",
        name: "Place Hazard",
        img: "icons/svg/mystery-man.svg",
        gmOnly: true,
        command: "game.pe.epopee.hazard();"
    },
    {
        key: "wall",
        name: "Place Wall",
        img: "icons/svg/mystery-man.svg",
        gmOnly: true,
        command: "game.pe.epopee.wall();"
    },
    {
        key: "travel",
        name: "Advance Travel Quarter",
        img: "systems/pe/static/images/macros/test.webp",
        gmOnly: true,
        command: "game.pe.epopee.travel();"
    },
    {
        key: "recall",
        name: "Recall to Poke Ball",
        img: "icons/svg/mystery-man.svg",
        gmOnly: false,
        command: "game.pe.epopee.recall();"
    },
    {
        key: "narrative-block",
        name: "Add Narrative Block (all Trainers)",
        img: "icons/svg/mystery-man.svg",
        gmOnly: true,
        command: "game.pe.epopee.narrativeBlock();"
    },
    {
        key: "shared-inventory",
        name: "Inventaire Partagé",
        img: "icons/svg/mystery-man.svg",
        gmOnly: false,
        command: "game.pe.epopee.sharedInventory();"
    }
];

export { EPOPEE_MACROS };
