export function registerTemplates() {
    return foundry.applications.handlebars.loadTemplates([

        // Actor Sheet Partials
        // "systems/pe/templates/partials/active-effects.hbs",
        "systems/pe/static/templates/partials/mod-field.hbs",
        "systems/pe/static/templates/partials/item-display-partial.hbs",

        // Item Sheet Partials
        "systems/pe/static/templates/partials/rules/rule-partial.hbs",
        "systems/pe/static/templates/partials/species-item-partial.hbs",

        // Token Sheet partials
        "systems/pe/static/templates/config/token/appearance-partial.hbs",
        "systems/pe/static/templates/config/token/identity-partial.hbs",

        "systems/pe/static/templates/apps/compendium-browser/filters.hbs",
        "systems/pe/static/templates/apps/compendium-browser/browser-settings.hbs",

        // Charactermancer Partials
        // "systems/pe/templates/partials/charactermancer-evolution-partial.hbs",
        // "/systems/pe/templates/partials/charactermancer/stat-block-partial.hbs"
    ]);
};