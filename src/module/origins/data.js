/**
 * Authored Origins, as plain data.
 *
 * The Origin wizard was written before any Origin existed: it drove the chain of choices
 * and read its content from a compendium, falling back to free-form entry. This file is
 * that missing content. Keeping Origins here rather than in a LevelDB pack means they
 * ship with a clone, need no setup step to appear, and can be reviewed in a diff - the
 * packs are binary, so an Origin authored in Foundry would be invisible to code review
 * and would need a migration to reach anyone else.
 *
 * Every field mirrors a row of the Origin sheet: the fluff intro, the three prompt
 * tables, the starting money, the Origin Trait and the numbered starting items.
 */

/**
 * How a starting-item row is written:
 *
 *  - `options`  the row offers a choice ("X ou Y") - the wizard shows a dropdown.
 *  - `prompt`   the row is decided by the player in their own words - a text field.
 *  - `grant`    the row is fixed - shown, granted as-is.
 *
 * `lookup` is the name to search for in `pe.items`, which is PTR's English list. Where a
 * French item has no PTR counterpart (a research bag, a notebook), `lookup` is absent and
 * the wizard creates a plain item under the French name instead.
 */
const ORIGINS = [
    {
        slug: "academicien",
        name: "Académicien",

        intro: [
            "Tu as passé ta vie à étudier et te renseigner, et tu es maintenant prêt à appliquer toutes tes connaissances au Monde des Pokémons. Tu as un don pour la connaissance, que ça soit sur les Pokémons, la Ligue, les dresseurs célèbres et le monde en général.",
            "Tu lis les livres, regardes des documentaires, écoutes les cours de professeurs et quand tu étudies, tu as un talent pour trouver toute information dont tu as besoin."
        ],

        startingPokemon: {
            text: "Un Pokémon de compagnie, pas trop agité et assez intelligent pour t'aider dans tes recherches.",
            examples: [
                "Un Funécire illuminant vos lectures la nuit",
                "Un Ramoloss qui aura peut-être une illumination soudaine",
                "Un Dinoclier se souvenant d'un passé lointain"
            ]
        },

        personalityPrompts: [
            "Quel est ton livre préféré et de quoi parle-t-il ?",
            "Est-ce que tu es bon orateur et que tu arrives à expliquer tes recherches aux autres ?",
            "En ville, quel serait le premier endroit où tu te rendrais ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Quel secret m'as-tu raconté que je protègerai ?",
            "Quel hobby étrange partageons-nous ?",
            "Pourquoi est-ce que tu m'intimides ?",
            "Pourquoi mes recherches t'intéressent-elles ?"
        ],

        money: 12500,

        trait: {
            name: "Spécialité Académique",
            description: [
                "Choisis une spécialité académique dans la liste ci-dessous, ou négocie-en une avec ton MJ.",
                "Quand tu fais un jet ayant un lien avec ta spécialité académique, fais ton jet deux fois et utilise le meilleur résultat."
            ],
            choiceLabel: "Spécialité académique",
            choices: [
                "Histoire du monde",
                "Maître de la Ligue",
                "Biologie Pokémon",
                "Habitats Pokémon",
                "Technologie Pokémon"
            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Sac de Recherche ou Sac de Chimie",
                options: [
                    { label: "Sac de Recherche" },
                    { label: "Sac de Chimie" }
                ]
            },
            {
                label: "1 livre décrivant tous les détails d'un sujet au choix",
                prompt: "Sujet du livre",
                name: (subject) => subject ? `Livre : ${subject}` : "Livre (sujet au choix)"
            },
            {
                label: "De quoi écrire, ou une liste des endroits à visiter là où tu te trouves",
                options: [
                    { label: "De quoi écrire" },
                    { label: "Liste des endroits à visiter" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal" },
                    { label: "Antidote", lookup: "Antidote" },
                    { label: "Anti-brûle", lookup: "Burn Heal" },
                    { label: "Anti-gel", lookup: "Ice Heal" }
                ]
            },
            {
                label: "2 Potions",
                grant: { label: "Potion", lookup: "Potion", quantity: 2 }
            },
            {
                label: "6 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 8 }
            }
        ]
    }
];

/** Lowercase, unaccented, hyphenated - used when an Origin omits its `slug`. */
function slugify(text) {
    return String(text ?? "")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/**
 * Fill in whatever an Origin left out.
 *
 * Origins are written by hand in this file, so half-filled is a normal state to be in: a
 * new one usually starts as a name, some money and a Trait, with the prompt tables added
 * later. Defaulting here means the wizard renders what exists and skips the rest, instead
 * of throwing on the first missing key and taking the whole window down.
 *
 * Only `name` is genuinely required.
 */
function normalise(origin) {
    const pokemon = origin.startingPokemon ?? {};
    const trait = origin.trait
        ? {
            choiceLabel: "Choix",
            allowCustom: false,
            ...origin.trait,
            name: origin.trait.name ?? "Trait d'Origine",
            description: origin.trait.description ?? [],
            choices: origin.trait.choices ?? []
        }
        : null;

    return {
        notes: "",
        ...origin,
        slug: origin.slug || slugify(origin.name),
        intro: origin.intro ?? [],
        money: Number(origin.money) || 0,
        items: origin.items ?? [],
        personalityPrompts: origin.personalityPrompts ?? [],
        relationshipPrompts: origin.relationshipPrompts ?? [],
        startingPokemon: { text: pokemon.text ?? "", examples: pokemon.examples ?? [] },
        trait
    };
}

/** @returns {object[]} */
function getOrigins() {
    return ORIGINS.map(normalise);
}

/**
 * @param {string} slug
 * @returns {object|undefined}
 */
function getOrigin(slug) {
    const found = ORIGINS.find(o => (o.slug || slugify(o.name)) === slug);
    return found ? normalise(found) : undefined;
}

/**
 * Resolve one starting-item row against what the player picked into a single grant.
 *
 * @param {object} entry     a row of `origin.items`
 * @param {string} selection the dropdown value or typed text for that row, if any
 * @returns {{label: string, lookup?: string, quantity: number}|null}
 */
function resolveItemGrant(entry, selection) {
    if (entry.grant) {
        return { quantity: 1, ...entry.grant };
    }

    if (entry.options) {
        const chosen = entry.options.find(o => o.label === selection) ?? entry.options[0];
        return { quantity: 1, ...chosen };
    }

    if (entry.prompt) {
        const text = String(selection ?? "").trim();
        const label = typeof entry.name === "function" ? entry.name(text) : (text || entry.label);
        return { label, quantity: 1 };
    }

    return null;
}

export { ORIGINS, getOrigins, getOrigin, resolveItemGrant };
