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
            "Tu lis des livres, regardes des documentaires, écoutes les cours de professeurs et quand tu étudies, tu as un talent pour trouver toute information dont tu as besoin."
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
                "Choisis une spécialité académique dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant un lien avec ta spécialité académique, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Spécialité académique",
            choices: [
                "Biologie Pokémon",
                "Habitats Pokémon",
                "Histoire du monde",
                "Maître de la Ligue",
                "Spécialiste Élémentaire",
                "Technologie Pokémon"
            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Sac de Recherche ou Explorakit",
                options: [
                    { label: "Sac de Recherche" },
                    { label: "Explorakit" }
                ]
            },
            {
                label: "1 livre décrivant tous les détails d'un sujet au choix",
                prompt: "Sujet du livre",
                name: (subject) => subject ? `Livre : ${subject}` : "Livre (sujet au choix)"
            },
            {
                label: "Des outils de mesure pour tes expériences ou un appareil photo pour tes observations",
                options: [
                    { label: "Des outils de mesure pour tes expériences" },
                    { label: "Un appareil photo pour tes observations" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal" },
                    { label: "Antidote", lookup: "Antidote" },
                    { label: "Anti-brûle", lookup: "Burn Heal" },
                    { label: "Anti-gel", lookup: "Ice Heal" },
                    { label: "Réveil", lookup: "Awakening" }
                ]
            },
            {
                label: "2 Potions",
                grant: { label: "Potion", lookup: "Potion", quantity: 2 }
            },
            {
                label: "6 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 6 }
            }
        ]
    },
    {
        slug: "artiste",
        name: "Artiste",

        intro: [
            "Le monde est une toile et tu crées de l'art où que tu ailles. Tu peux être un artiste de spectacle vivant;  danser, chanter ou prendre place dans le coeur des gens par le théâtre, le cinéma ou même être une personnalité de télévision.",
            "Ou bien, tu es un artiste dont le travail est vu sur les murs d'un musée, sur les étagères d'une bibliothèque, dans les assiettes d'une grande cuisine, ou un designer de fashion. Qu'importe tes méthodes, ton talent artistique a des usages uniques dans le monde où tu évolues."
        ],

        startingPokemon: {
            text: "Un Pokémon flamboyant, prêt à se faire remarquer ou bien toujours là pour soutenir ton art.",
            examples: [
                "Un Skitty admirablement toiletté",
                "Un Ouisticram tête brûlée et acrobate",
                "Un Grimalin au regard artistique"
            ]
        },

        personalityPrompts: [
            "Quel est ton endroit préféré pour créer ?",
            "Est-ce que tu es à l'aise avec le grand public ?",
            "Qui est ta muse ou ta plus grande inspiration ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Comment est-ce que je te surprends ?",
            "Pourquoi est-ce que tu cherches à m'éviter ?",
            "Pour quelles raisons je t'observe avec attention ?",
            "À quel Pokémon me fais-tu penser ?"
        ],

        money: 75000,

        trait: {
            name: "Un Monde Merveilleux",
            description: [
                "Choisis une profession artistique dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant un lien avec ta profession artistique, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Un Monde Merveilleux",
            choices: [
                "Acteur",
                "Architecte",
                "Auteur",
                "Danceur",
                "Designer",
                "Dessinateur",
                "Mannequinat",
                "Musicien",
                "Peintre",
                "Photographe",
                "Poète",
                "Sculpteur",

            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Coffret Mode ou Sac de Sport",
                options: [
                    { label: "Coffret Mode" },
                    { label: "Sac de Sport" }
                ]
            },
            {
                label: "Une médaille prouvant ta participation à un concours artistique ou un objet essentiel à ta profession artistique",
                options: [
                    { label: "Une médaille prouvant ta participation à un concours artistique" },
                    { label: "Un objet essentiel à ta profession artistique" }
                ]
            },
            {
                label: "Un costume que tu mets pour te porter chance ou un appareil photo déjà bien rempli",
                options: [
                    { label: "Un costume que tu mets pour te porter chance" },
                    { label: "Un appareil photo déjà bien rempli" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal" },
                    { label: "Antidote", lookup: "Antidote" },
                    { label: "Anti-brûle", lookup: "Burn Heal" },
                    { label: "Anti-gel", lookup: "Ice Heal" },
                    { label: "Réveil", lookup: "Awakening" }
                ]
            },
            {
                label: "1 Potions",
                grant: { label: "Potion", lookup: "Potion", quantity: 1 }
            },
            {
                label: "3 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 3 }
            }
        ]
    },
    {
        slug: "athlete",
        name: "Athlète",

        intro: [
            "Avant de partir, tu étais un athlète professionnel. Tu as passé des heures à développer tes capacités en tant que golfer, plongeur ou gymnaste. Peut être que tu faisais parti d'une équipe, de football, baseball ou même water polo.",
            "Tu même être devenu un pro dans un sport où tu affrontes face à face d'autres, comme au tennis ou bien la boxe. Peut être que tu cherchais la vitesse et le goût du risque avant tout, en tant que snowboarder professionnel, ou bien cycliste. Qu'importe ta profession, ta puissance et tes entrainements te donnent la force d'explorer le monde."
        ],

        startingPokemon: {
            text: "Un Pokémon sportif prêt à te suivre, ou juste une boule d'hyperactivité qui ne se laisse jamais épuiser.",
            examples: [
                "Un Débugant inarrêtable et très motivé",
                "Un Crabagarre bien décidé à se battre et vaincre le monde entier",
                "Un Tissenboule pas bien dégourdi mais là pour t'encourager"
            ]
        },

        personalityPrompts: [
            "Qu'est-ce qui te motive à te lever tout les matins ?",
            "Es-tu plutôt du matin ou du soir ?",
            "À quel moment te sens-tu le plus en paix ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Comment est-ce que je te motive et t'encourage ?",
            "Est-ce que je te rappelle quelqu'un ?",
            "Pourquoi est-ce que je t'ai abordé pour discuter et quand ?",
            "Pourquoi est-ce que j'ai eu envie de te cogner ?"
        ],

        money: 75000,

        trait: {
            name: "Constitution Athlétique",
            description: [
                "Choisis une profession athlétique dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant un lien avec ta profession athlétique, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Constitution Athlétique",
            choices: [
                "Cavalier Pokémon",
                "Champion de tennis",
                "Coureur",
                "Footballeur",
                "Grimpeur",
                "Nageur",

            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Un Sac de Sport ou un Sac de Dresseur",
                options: [
                    { label: "Sac de Sport" },
                    { label: "Sac de Dresseur" }
                ]
            },
            {
                label: "Une médaille ou un ruban prouvant ta victoire à une compétition",
                options: [
                    { label: "Une médaille ou un ruban prouvant ta victoire à une compétition" }
                ]
            },
            {
                label: "Des poids que tu soulèves pour t'entrainer ou ton plan d'entrainement et de nutrition",
                options: [
                    { label: "Des poids que tu soulèves pour t'entrainer" },
                    { label: "Ton plan d'entrainement et de nutrition" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "2 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal", quantity: 2 },
                    { label: "Antidote", lookup: "Antidote", quantity: 2 },
                    { label: "Anti-brûle", lookup: "Burn Heal", quantity: 2 },
                    { label: "Anti-gel", lookup: "Ice Heal", quantity: 2 },
                    { label: "Réveil", lookup: "Awakening", quantity: 2 }
                ]
            },
            {
                label: "1 Potions",
                grant: { label: "Potion", lookup: "Potion", quantity: 1 }
            },
            {
                label: "2 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 2 }
            }
        ]
    },    {
        slug: "col-blanc",
        name: "Col Blanc",

        intro: [
            "Un long travail répétitif de 9h à 17h tout les jours ne t'es pas étranger, mais ça permet au moins de soutenir un train de vie plutôt confortable et de faire des économie. Qu'importe que tu sois un comptable bourru aux maths, un travailleur aux ressources humaines, le dirigeant d'une petite entreprise, ou même un avocat, tu as beaucoup d'expérience.",
            "Tu as évolué en apprenant à travailler en entreprise, et tu as appris à bien travailler aux côtés de tes collègues vers un objectif commun. Planification, assiduité, et un attention aux détails peuvent toujours donner un avantage. Et si ça ne paye pas, tu auras toujours un truc à ajouter à ton CV."
        ],

        startingPokemon: {
            text: "Un Pokémon calme qui n'interrompt pas ta vie de bureau, ou un Pokémon qui est là pour te sourire et te donner un coup de patte.",
            examples: [
                "Un Patâchiot tout sage qui attend à tes pieds",
                "Un Psytigri qui sait où sont cachés tout tes stylos quand tu les cherches",
                "Un Ratentif travailleur mais qui se déconcentre souvent"
            ]
        },

        personalityPrompts: [
            "Pourquoi restes-tu ou non tard le soir au bureau ?",
            "Quelle est ton loisir principal quand tu as enfin du temps pour toi ?",
            "Où est-ce que tu rêverais d'aller un jour ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Pourquoi est-ce que je te semble ennuyant ?",
            "Comment est-ce que je te fais comprendre que tu déranges ?",
            "Pourquoi est-ce que j'aime passer du temps avec toi ?",
            "Qu'est-ce qui fait que nous partageons le même humour ?"
        ],

        money: 60000,

        trait: {
            name: "Le 35h",
            description: [
                "Choisis une profession dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant un lien avec ta profession, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Le 35h",
            choices: [
                "Avocat",
                "Banquier",
                "Bureaucrate",
                "Chargé des ressources humaines",
                "Comptable",
                "Consultant en gestion",
                "Responsable marketing",

            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Un Coffret Mode ou un Sac de Recherche",
                options: [
                    { label: "Coffret Mode" },
                    { label: "Sac de Recherche" }
                ]
            },
            {
                label: "Un vélo transportable pour aller bosser",
                options: [
                    { label: "Un vélo transportable" }
                ]
            },
            {
                label: "Une pile de paperasse oubliée ou une cravate très colorée",
                options: [
                    { label: "Une pile de paperasse oubliée" },
                    { label: "Une cravate très colorée" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal" },
                    { label: "Antidote", lookup: "Antidote" },
                    { label: "Anti-brûle", lookup: "Burn Heal" },
                    { label: "Anti-gel", lookup: "Ice Heal" },
                    { label: "Réveil", lookup: "Awakening" }
                ]
            },
            {
                label: "2 Potions",
                grant: { label: "Potion", lookup: "Potion", quantity: 2 }
            },
            {
                label: "6 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 6 }
            }
        ]
    },    {
        slug: "docteur",
        name: "Docteur",

        intro: [
            "Étudier la connaissance médicale pour devenir un professionnel de la santé a prit des années complètes de ta vie. Tu peux avoir étudié pour être médecin généraliste, psychiatre, pharmacien, chirurgien, ou un infirmier dans un centre Pokémon. Tu peux aussi avoir été un practicien de naturopathie avec des années d'études ou de pratiques.",
            "Bien que ton savoir spécialisé peut ne pas avoir directement affecté ton savoir de Pokémon, tu as pu avoir un train de vie confortable en étant payé pour soigner ceux dans le besoin."
        ],

        startingPokemon: {
            text: "Un Pokémon doux et rassurant avec tes patients, ou bien un blagueur là pour faire rire les autres.",
            examples: [
                "Un Leveinard prêt à aider les autres en toute circonstance",
                "Un Zorua farceur qui se transforme pour faire sourire",
                "Un Sucroquin parfait pour se rassurer en le serrant dans ses bras"
            ]
        },

        personalityPrompts: [
            "Quel est la première chose que tu fais tôt le matin ?",
            "Est-ce que l'empathie est quelque chose d'évident pour toi et les autres ?",
            "Es-tu infallible malgré l'urgence et les situations de panique ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Je t'ai déjà rendu service par le passé, comment et pourquoi ?",
            "Pourquoi est-ce que je veux te protéger ?",
            "Qu'est-ce que tu as fait pour que j'ai envie de t'éviter ?",
            "Est-ce que j'approuve de toutes les idées que tu proposes ?"
        ],

        money: 75000,

        trait: {
            name: "Bon docteur",
            description: [
                "Choisis une spécialité médicale dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant un lien avec ta profession, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Bon docteur",
            choices: [
                "Chercheur médical",
                "Chirurgien",
                "Médecin Généraliste",
                "Naturopathe",
                "Pharmacien",
                "Psychiatre"

            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Sac Médical ou Sac de Recherche",
                options: [
                    { label: "Sac Médical" },
                    { label: "Sac de Recherche" }
                ]
            },
            {
                label: "Un grigri porte-chance ou un ruban offert par un de tes patients",
                options: [
                    { label: "Un grigri porte-chance" },
                    { label: "Un ruban offert par un de tes patients" }
                ]
            },
            {
                label: "Des vêtements de rechange facile à couper pour faire des bandages",
                options: [
                    { label: "Des vêtements de rechange facile à couper pour faire des bandages" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal" },
                    { label: "Antidote", lookup: "Antidote" },
                    { label: "Anti-brûle", lookup: "Burn Heal" },
                    { label: "Anti-gel", lookup: "Ice Heal" },
                    { label: "Réveil", lookup: "Awakening" }
                ]
            },
            {
                label: "2 Potions",
                grant: { label: "Potion", lookup: "Potion", quantity: 2 }
            },
            {
                label: "3 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 6 }
            }
        ]
    },    {
        slug: "col-bleu",
        name: "Col Bleu",

        intro: [
            "Quelqu'un doit le faire, et ça sera toi. Au boulot, tu te mets au travail, utilisant ton expérience et ton savoir-faire pour rendre les tâches plus simples; travailler intelligemment.",
            "Tu peux avoir travaillé dans la construction, ou le paysagisme, sur un pokémon ou dans une ferme à baie, dans un entrepôt ou une usine, à conduire des camions toute la journée, ou sur un site spécialisé où tu mets les mains à l'ouvrage. \n" +
            "Tu changes peut être de rythme à présent, mais le dur travail ne t'es pas étranger et tu seras capable de mettre ton endurance à l'épreuve."
        ],

        startingPokemon: {
            text: "Un Pokémon fort capable de t'aider dans tes travaux physiques, ou un Pokémon là pour t'aider à te détendre après une longue journée.",
            examples: [
                "Un Charpenti prêt à porter tout ce qui est trop lourd pour toi",
                "Un Poussacha qui te fait rire de sa bonne humeur",
                "Un Kraknoix un peu lent, mais toujours là pour toi"
            ]
        },

        personalityPrompts: [
            "Qu'est-ce qui te rend le plus fier dans ton travail ?",
            "Que fais-tu le soir en rentrant chez toi ?",
            "Quelle est ta passion secrète ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Quand est-ce que je t'ai rendu service ?",
            "Pourquoi est-ce que tu m'agaces ?",
            "Est-ce que j'ai déjà travaillé pour toi et quand ?",
            "Est-ce que je t'impressionne ?"
        ],

        money: 35000,

        trait: {
            name: "Travail honnête",
            description: [
                "Choisis une profession dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant un lien avec ta profession, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Travail honnête",
            choices: [
                "Charpentier",
                "Éboueur",
                "Installateur d'infrastructures électriques",
                "Mécanicien",
                "Ouvrier d'entrepôt",
                "Pompier",
                "Plombier",
                "Travailleur d'usine",

            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Sac Médical ou Sac de Sport",
                options: [
                    { label: "Sac Médical" },
                    { label: "Sac de Sport" }
                ]
            },
            {
                label: "Le premier sou que tu as reçu ou un manuel de ton hobby préféré",
                options: [
                    { label: "Le premier sou que tu as reçu" },
                    { label: "Un manuel de ton hobby préféré" }
                ]
            },
            {
                label: "Un vélo transportable ou une canne à pêche",
                options: [
                    { label: "Un vélo transportable" },
                    { label: "Une canne à pêche" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal" },
                    { label: "Antidote", lookup: "Antidote" },
                    { label: "Anti-brûle", lookup: "Burn Heal" },
                    { label: "Anti-gel", lookup: "Ice Heal" },
                    { label: "Réveil", lookup: "Awakening" }
                ]
            },
            {
                label: "3 Super Potions",
                grant: { label: "Super Potion", lookup: "Super Potion", quantity: 3 }
            },
            {
                label: "6 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 3 }
            }
        ]
    },    {
        slug: "dresseur-arene",
        name: "Dresseur d'Arène",

        intro: [
            "Passer du temps en tant que membre de la league travaillant pour un champion d'arène t'as beaucoup aidé. Tu as étudié le style et beaucoup appris sur le fonctionnement des combats Pokémon, bien qu'il ne s'agissait pas de tes propres Pokémons.",
            "Ton expérience du terrain t'as donné un avantage en combattant contre d'autres dresseurs et cet avantage a prouvé encore et encore son utilité en combat avec ta propre équipe."
        ],

        startingPokemon: {
            text: "Un Pokémon représentant à la perfection l'arène où tu travaillait, ou un petit combattant toujours prêt à faire mordre la poussière.",
            examples: [
                "Un Grenousse discret se glissant dans le dos des challengers",
                "Un Osselait voulant prendre sa revanche sur le monde",
                "Un Wattouat aussi mignon qu'agressif"
            ]
        },

        personalityPrompts: [
            "Quel a été ton meilleur combat d'arène et pourquoi ?",
            "Pourquoi tu as rejoins spécifiquement cette arène où travailler ?",
            "Comment te sens-tu face à d'autres dresseurs avec moins d'expérience ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Quand est-ce que je t'ai affronté en combat Pokémon et comment cela s'est passé ?",
            "Pourquoi veux-tu me soutenir ?",
            "Pourquoi est-ce que tu me rassures ?",
            "Je te rappelle quelqu'un, qui et pourquoi ?"
        ],

        money: 20000,

        trait: {
            name: "Stratégie interne",
            description: [
                "Choisis deux traits de personnalité qui décriraient ton champion d'arène dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant en lien avec une Arène, la League, une Zone de Combat, un membre important de ces lieux ou un de ses pokémons et que ton champion d'arène partage un trait de personnalité avec cet individu, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Stratégie interne",
            choices: [
                "Affectueux",
                "Bizarre",
                "Charmant",
                "Commandant",
                "Désagréable",
                "Énergique",
                "Génie",
                "Glamour",
                "Stoïque",

            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Sac de Dresseur ou Sac de Voyageur",
                options: [
                    { label: "Sac de Dresseur" },
                    { label: "Sac de Voyageur" }
                ]
            },
            {
                label: "Un accessoire gimmick de ton arène (un gantelet, épaulière, pendantif, badge, une casquette...)",
                options: [
                    { label: "Un accessoire gimmick de ton arène" }
                ]
            },
            {
                label: "Le badge de l'arène ou tu as travaillé ou un mystérieux foulard trouvé après un combat",
                options: [
                    { label: "Le badge de l'arène ou tu as travaillé" },
                    { label: "Un mystérieux foulard trouvé après un combat" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "2 soin de statut au choix ou 2 potions",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal", quantity: 2 },
                    { label: "Antidote", lookup: "Antidote", quantity: 2 },
                    { label: "Anti-brûle", lookup: "Burn Heal", quantity: 2 },
                    { label: "Anti-gel", lookup: "Ice Heal", quantity: 2 },
                    { label: "Réveil", lookup: "Awakening", quantity: 2 },
                    { label: "Potion", lookup: "Potion", quantity: 2 }
                ]
            },
            {
                label: "5 baies de résistances de type utiles dans l'arène où tu étais ",
                options: [
                    { label: "Baie Chocco",     lookup: "Occa Berry",       quantity: 5 },
                    { label: "Baie Pocpoc",     lookup: "Passho Berry",     quantity: 5 },
                    { label: "Baie Parma",      lookup: "Wacan Berry",      quantity: 5 },
                    { label: "Baie Ratam",      lookup: "Rindo Berry",      quantity: 5 },
                    { label: "Baie Nanone",     lookup: "Yache Berry",      quantity: 5 },
                    { label: "Baie Pomroz",     lookup: "Chople Berry",     quantity: 5 },
                    { label: "Baie Kébia",      lookup: "Kebia Berry",      quantity: 5 },
                    { label: "Baie Jouca",      lookup: "Shuca Berry",      quantity: 5 },
                    { label: "Baie Cobaba",     lookup: "Coba Berry",       quantity: 5 },
                    { label: "Baie Yapap",      lookup: "Payapa Berry",     quantity: 5 },
                    { label: "Baie Panga",      lookup: "Tanga Berry",      quantity: 5 },
                    { label: "Baie Charti",     lookup: "Charti Berry",     quantity: 5 },
                    { label: "Baie Sédra",      lookup: "Kasib Berry",      quantity: 5 },
                    { label: "Baie Fraigo",     lookup: "Haban Berry",      quantity: 5 },
                    { label: "Baie Lampou",     lookup: "Colbur Berry",     quantity: 5 },
                    { label: "Baie Babiri",     lookup: "Babiri Berry",     quantity: 5 },
                    { label: "Baie Zalis",      lookup: "Chilan Berry",     quantity: 5 },
                    { label: "Baie Selro",      lookup: "Roseli Berry",     quantity: 5 }
                ]
            },
            {
                label: "6 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 6 }
            }
        ]
    },    {
        slug: "entoure-pokemon",
        name: "Entouré par les Pokémons",

        intro: [
            "S'il y a bien une personne qui a toujours vécu aux côtés de Pokémon, c'est bien toi. Depuis tes premiers pas, passer du temps à leurs côtés, t'en occuper et les élever a toujours été ton premier objectif.",
            "Que ça soit en travaillant dans un élevage, en les toilettant tout les jours, en les prommenant quand leurs propriétaires ne peuvent pas, ou même travailler à leurs réhabilitation, tu es là pour eux, et ils te le rendent bien. Cette connaissance profonde des Pokémons et de leurs habitudes ne peut être que positive pour le futur."
        ],

        startingPokemon: {
            text: "Un Pokémon doux et compréhensif avec ses congénaires, ou un bonhomme timide en pleine réhabilitation.",
            examples: [
                "Un Flotillon très calme avec qui faire la sieste",
                "Un Rocabot trop énergique qui est là pour épuiser les autres",
                "Un Tarsal très craintif de l'homme, se cachant derrière toi tout le temps"
            ]
        },

        personalityPrompts: [
            "Quelle est ta relation avec les Pokémons sauvages ?",
            "Comment te sens-tu face à la violence ou au combat ?",
            "Vers quel Pokémon te tournes-tu pour te ressourcer ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Pourquoi t'aurais-je aider face à un Pokémon et comment ?",
            "Est-ce que tu juges mes méthodes d'élevage et pourquoi ?",
            "Comment est-ce que je te rends service quand je le peux ?",
            "Pourquoi est-ce que je veux t'accompagner ?"
        ],

        money: 30000,

        trait: {
            name: "Mon tout petit",
            description: [
                "Choisis une spécialité d'élevage dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant un lien avec ta spécialité d'élevage, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Mon tout petit",
            choices: [
                "Éleveur",
                "Éducateur Pokémon",
                "Manutentionnaire",
                "Personnel de réhabilitation",
                "Poké-sitter",
                "Toiletteur",

            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Sac de Dresseur ou Sac Médical",
                options: [
                    { label: "Sac de Dresseur" },
                    { label: "Sac Médical" }
                ]
            },
            {
                label: "Des photos souvenir de tout les Pokémons avec qui tu as interagi",
                options: [
                    { label: "Des photos souvenir de tout les Pokémons avec qui tu as interagi" }
                ]
            },
            {
                label: "Un jouet à pokémon un peu abimé ou une couverture lestée réconfortante",
                options: [
                    { label: "Un jouet à pokémon un peu abimé" },
                    { label: "Une couverture lestée réconfortante" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal" },
                    { label: "Antidote", lookup: "Antidote" },
                    { label: "Anti-brûle", lookup: "Burn Heal" },
                    { label: "Anti-gel", lookup: "Ice Heal" },
                    { label: "Réveil", lookup: "Awakening" }
                ]
            },
            {
                label: "2 Super Potions",
                grant: { label: "Super Potion", lookup: "Super Potion", quantity: 2 }
            },
            {
                label: "3 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 3 }
            }
        ]
    },    {
        slug: "ermite",
        name: "Ermite",

        intro: [
            "L'appel des espaces sauvages de ce monde était impossible à résister. Tu pars à l'aventure. Tu as probablement déjà un Pokémon, mais certainement peu de contact humain. Quand il s'agit de nature, tu as voyager par mont par vaux.",
            "Qu'il s'agisse de terrains montagneux, ou la côte d'une plage de sable fin, tu fais trouver ton chemin dans les formes naturelles du monde et peut camper pour des jours sans t'inquiéter. Éviter la maison des Pokémons et leurs espaces de chasse est naturel pour toi et passer du temps dans la nature te semble être comme chez toi plus qu'un bâtiment."
        ],

        startingPokemon: {
            text: "Un Pokémon se mêlant tellement à la nature qu'on l'oublie, ou bien un petit être résilient prêt à voyager jusqu'au bout du monde.",
            examples: [
                "Un Flabébé se glissant dans ta poche quand il est fatigué",
                "Un Grillepatte un peu trop enthousiaste à quitter son chez-soi",
                "Un Fouinette très curieux et habitué à se faufiler partout"
            ]
        },

        personalityPrompts: [
            "Quel est ton désir le plus profond ?",
            "As-tu un tic ou une habitude qui ressort régulièrement ?",
            "Que fais-tu quand il pleut ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Tu m'as déjà croisé par le passé, quand et comment ?",
            "Même dans une foule, tu ressors plus facilement à mes yeux, pourquoi ?",
            "Qu'est-ce que je fais que tu trouves étrange ?",
            "Pourquoi est-ce que ta présence m'ennui ?"
        ],

        money: 8000,

        trait: {
            name: "Routes du vagabondage",
            description: [
                "Choisis deux terrains qui sont tes favoris dans la liste ci-dessous.",
                "Quand tu fais un jet de compétence ayant un lien avec ton terrain favoris, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Routes du vagabondage",
            choices: [
                "Plaine",
                "Forêt",
                "Marais",
                "Océan",
                "Toundra",
                "Montagne",
                "Caverne",
                "Urbain",
                "Désert",

            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Sac de Voyageur ou Sac de Sport",
                options: [
                    { label: "Sac de Voyageur" },
                    { label: "Sac de Sport" }
                ]
            },
            {
                label: "Une grande pelle ou une canne à pêche",
                options: [
                    { label: "Une grande pelle" },
                    { label: "Une canne à pêche" }
                ]
            },
            {
                label: "Un herbier que tu créés depuis longtemps ou une plume de tout les Pokémons oiseaux que tu as croisé",
                options: [
                    { label: "Un herbier que tu créés depuis longtemps" },
                    { label: "Une plume de tout les Pokémons oiseaux que tu as croisé" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "3 baies soignant le statut au choix",
                options: [
                    { label: "Baie Ceriz", lookup: "Cheri Berry", quantity: 3 },
                    { label: "Baie Maron", lookup: "Chesto Berry", quantity: 3 },
                    { label: "Baie Pêcha", lookup: "Pecha Berry", quantity: 3 },
                    { label: "Baie Fraive", lookup: "Rawst Berry", quantity: 3 },
                    { label: "Baie Willia", lookup: "Aspear Berry", quantity: 3 }
                ]
            },
            {
                label: "1 Baie Sitrus",
                grant: { label: "Baie Sitrus", lookup: "Sitrus Berry", quantity: 1 }
            },
            {
                label: "2 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 2 }
            }
        ]
    },    {
        slug: "explorateur",
        name: "Explorateur",

        intro: [
            "Fortune, gloire et pouvoir. Qu'importe lequel t'attires, tu as décidé de partir explorer et rechercher dans des ruines perdues, ou bien étudier en détail les restes d'une civilisation disparue.",
            "Peut être que tu suis toutes les cartes aux trésors que tu peux trouver, ou bien tu es membres d'une glorieuse expédition destinée à retrouver une relique de légende. En tout cas, ces voyages et recherches t'ont mené à développer de nombreuses capacités de survie et une perception affilée. On ne sait jamais, peut être que la salle aux trésors est piégée."
        ],

        startingPokemon: {
            text: "Un Pokémon dont la curiosité est sans limite, ou bien voulant t'accompagner partout malgré le danger.",
            examples: [
                "Un Gobou voulant se faufiler partout",
                "Un Evoli particulièrement adaptable à son environnement",
                "Un Poltchageist à la recherche de ses origines"
            ]
        },

        personalityPrompts: [
            "Dans quel endroit te sens-tu le mieux ?",
            "Quelle est ta plus grande trouvaille ?",
            "Pourquoi est-ce que l'exploration te passionne ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Je t'ai déjà sauvé la vie, comment ?",
            "Qu'ais-je fais pour attirer ta colère une fois ?",
            "Je t'ai offert une vieille trouvaille, qu'est-ce que c'est ?",
            "Comment est-ce que j'ai réussi à te surprendre ?"
        ],

        money: 20000,

        trait: {
            name: "20 mille lieux sous terre",
            description: [
                "Choisis une spécialité dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant un lien avec ta spécialité, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "20 mille lieux sous terre",
            choices: [
                "Archéologue",
                "Cartographe",
                "Chasseur de Trésor",
                "Collecteur de Relique",
                "Explorateur de Grotte",
                "Membre d'Expédition",
                "Paléontologue",

            ],
            // The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Explorakit ou Sac de Voyageur",
                options: [
                    { label: "Explorakit" },
                    { label: "Sac de Voyageur" }
                ]
            },
            {
                label: "Une carte aux trésors mystérieuse et pleine de poussière ou une breloque dont tu es convaincu qu'elle a de la valeur et est spéciale",
                options: [
                    { label: "Une carte aux trésors mystérieuse et pleine de poussière" },
                    { label : "Une breloque dont tu es convaincu qu'elle a de la valeur et est spéciale"}
                ]
            },
            {
                label: "Un Cherch'objet un peu défectueux mais qui t'as bien servi par le passé",
                options: [
                    { label: "Un Cherch'objet un peu défectueux mais qui t'as bien servi par le passé" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 baies soignant le statut au choix ou une Poképoupée",
                options: [
                    { label: "Baie Ceriz", lookup: "Cheri Berry" },
                    { label: "Baie Maron", lookup: "Chesto Berry" },
                    { label: "Baie Pêcha", lookup: "Pecha Berry" },
                    { label: "Baie Fraive", lookup: "Rawst Berry" },
                    { label: "Baie Willia", lookup: "Aspear Berry" },
                    { label: "Poképoupée"}
                ]
            },
            {
                label: "2 Potions ou 3 Baies Oran",
                options: [ 
                    { label: "Potion", lookup: "Potion", quantity: 2 },
                    { label: "Baie Oran", lookup: "Oran Berry", quantity: 3}
                ]
            },
            {
                label: "2 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 2 }
            }
        ]
    },    {
        slug: "force-ordre",
        name: "Force de l'Ordre",

        intro: [
            "Le monde a besoin de héros et tu t'es entrainé pour en devenir un. Étant quelqu'un qui est allé à l'académie de maintien de l'ordre, tu es connaisseur sur le sujet de la police, des rangers et comment ils opèrent. Tu es qualifié pour être un ranger ou un officier, mais peut-être ne t'es-tu jamais engagé et a poursuivi autre chose après ton diplôme ?",
            "Peut être que tu as travaillé pendant des années à un bureau, ou que tu es toujours sur le terrain. Qu'importe les circonstances, tu es ici face au monde des Pokémons et est prêt à faire la différence."
        ],

        startingPokemon: {
            text: "Un Pokémon qui t'accompagne depuis des années ou un Pokémon reconnaissant de ton aide par le passé.",
            examples: [
                "Un Monorpale affûté qui affronte le danger sans peur",
                "Un Tarsal dont les pouvoirs télékinésiques t'aident à repérer les dangers",
                "Un Frissonille qui surveille les environs du sommet de ta tête"
            ]
        },

        personalityPrompts: [
            "Comment te sens-tu face au danger ?",
            "Quel est le moment le plus satisfaisant de ton travail ?",
            "Pourquoi est-ce que tu préfères ce métier à d'autres plus sûrs ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "On se connait depuis longtemps mais comment ?",
            "Pourquoi je préfère te surveiller ?",
            "Comment t'ais-je sauvé par le passé ?",
            "Qu'est-ce que j'ai fait qui t'inspire de la peur ?"
        ],

        money: 40000,

        trait: {
            name: "Servir et protéger",
            description: [
                "Quand tu fais un jet de compétence en tant que ranger ou membre des forces de l'ordre, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ]
        },

        items: [
            {
                label: "Explorakit ou Sac de Diplomate",
                options: [
                    { label: "Explorakit" },
                    { label: "Sac de Diplomate" }
                ]
            },
            {
                label: "Quelques rations de survie qui ont vécu des jours meilleures",
                options: [
                    { label: "Quelques rations de survie qui ont vécu des jours meilleures" }
                ]
            },
            {
                label: "Ton badge d'officier ou un objet offert par un enfant que tu as aidé",
                options: [
                    { label: "Ton badge d'officier" },
                    { label: "Un objet offert par un enfant que tu as aidé" }
                ]
            },
            {
                // The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal", quantity: 2 },
                    { label: "Antidote", lookup: "Antidote", quantity: 2 },
                    { label: "Anti-brûle", lookup: "Burn Heal", quantity: 2 },
                    { label: "Anti-gel", lookup: "Ice Heal", quantity: 2 },
                    { label: "Réveil", lookup: "Awakening", quantity: 2 }
                ]
            },
            {
                label: "3 Potions",
                grant: { label: "Potion", lookup: "Potion", quantity: 3 }
            },
            {
                label: "3 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 3 }
            }
        ]
    },    {
        slug: "marchand",
        name: "Marchand",

        intro: [
            "Le marchandage, la négociation et la vente, c'est bien quelque chose que tu as dans le sang. A force de vendre, tu as réussi à amasser une grande quantité d'argument et de raisons pour lesquelles tes produits sont bien meilleurs que ceux du voisin. ",
            "Que tu sois marchants itinérants, ayant voyagé un peu partout, propriétaire d'une petite épicerie ou vendeur de pokéball dans une multinationale, ces compétences avec le public te rendent bien souvent de bons services et te permettent d'évoluer dans le monde des Pokémons avec un certain calme et une grande assurance."
        ],

        startingPokemon: {
            text: "Un Pokémon qui est là pour t'aider à vendre, ou juste qui occupe les clients quand tu fais autre chose.",
            examples: [
                "Un Pikachu dont la frimousse fait fondre tout les acheteurs",
                "Un Sonistrelle qui surveille tout le monde et veut te protéger des voleurs",
                "Un Olivini adorable qui compte les marchandises régulièrement"
            ]
        },

        personalityPrompts: [
            "Est-ce que tu es radin, ou vend pour pouvoir dépenser plus tard ?",
            "Pourquoi est-ce que tu t'es intéressé au marchandage ?",
            "Est-ce que rencontrer des gens hors travail te dérange ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Pourquoi est-ce que je te parais ridicule ?",
            "Comment est-ce que je t'ai persuadé d'acheter quelque chose ?",
            "Qu'est-ce qui t'agace chez moi ?",
            "Pourquoi est-ce que tu te tiens loin de moi ?"
        ],

        money: 75000,

        trait: {
            name: "Dépensez sans compter",
            description: [
                "Choisis une profession dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant un lien avec ton profession, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Dépensez sans compter",
            choices: [
                "Entrepreneur",
                "Marchand itinérant",
                "Propriétaire de petit commerce",
                "Trader",
                "Vendeur",
                "Vendeur aux enchères",
                "Vendeur de Pokémon"

            ],
// The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Sac de Diplomate ou Sac de Voyageur",
                options: [
                    { label: "Sac de Diplomate" },
                    { label: "Sac de Voyageur" }
                ]
            },
            {
                label: "De beaux vêtements propres ou un oreiller bien confortable",
                options: [
                    { label: "De beaux vêtements propres" },
                    { label: "Un oreiller bien confortable" }
                ]
            },
            {
                label: "Un document à présenter aux représentant de la ville pour avoir une place confortable exclusive ou 10 000₽",
                options: [
                    { label: "Un document à présenter aux représentant de la ville" },
                    { label: "10 000₽" }
                ]
            },
            {
                label: "1 Guérison",
                grant: { label: "Potion", lookup: "Full Restore", quantity: 1 }
            },
            {
                label: "2 Potions",
                grant: { label: "Potion", lookup: "Potion", quantity: 2 }
            },
            {
                label: "4 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 4 }
            }
        ]
    },      {
        slug: "militaire",
        name: "Militaire",

        intro: [
            "Le combat, c'est bien le sujet que tu connais le mieux. Tu as été sur le champ de bataille, tu as affronté humains et Pokémons. Bien vite, les combats sont devenus violents, mais tu as survécu à cela et tu es maintenant présent pour en parler.",
            "Tu t'es certainement illustré par des actions inoubliables qui ont changé le tournant des affrontements. Ou bien tu es resté à l'arrière, laissant les autres y aller à ta place. Mais le fait que tu sois encore là est une preuve de ta débrouillardise et de tes capacités physiques et morales. Visiblement, rien ne t'arrêtera."
        ],

        startingPokemon: {
            text: "Un Pokémon bon combattant qui cherche encore à prouver sa valeur ou un Pokémon fatigué qui te suit par loyauté.",
            examples: [
                "Un Scorplane qui attaquera le premier qui le regarde mal",
                "Un Charibari traumatisé et passant juste son temps avec toi",
                "Un Moufette faisant sa mission de s'assurer qu'il ne t'arrive rien"
            ]
        },

        personalityPrompts: [
            "Pourquoi as-tu rejoins les combats ?",
            "Est-ce que tu es toujours proche de ta famille ?",
            "Quelle est ta façon de combattre préférée ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Pourquoi te regarder me rappelle de mauvais souvenirs ?",
            "Quelle histoire je te raconte pour t'impressionner ?",
            "Quand est-ce que je t'ai croisé alors que j'étais au plus mal ?",
            "Pourquoi suis-je incapable de te faire confiance ?"
        ],

        money: 60000,

        trait: {
            name: "Art de la Guerre",
            description: [
                "Choisis une spécialité militaire dans la liste ci-dessous, ou négocie en une avec ton MJ.",
                "Quand tu fais un jet de compétence ayant un lien avec ta spécialité militaire, fais ton jet de compétence deux fois et utilises le meilleur résultat."
            ],
            choiceLabel: "Art de la Guerre",
            choices: [
                "Ingénieur militaire",
                "Jeune recrue",
                "Médecin de combat",
                "Mercenaire",
                "Soldat",
                "Stratège",
                "Vétéran de guerre"

            ],
// The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
            allowCustom: true
        },

        items: [
            {
                label: "Sac de Sport ou Sac de Diplomate",
                options: [
                    { label: "Sac de Sport" },
                    { label: "Sac de Diplomate" }
                ]
            },
            {
                label: "Une arme peut être rouillée mais qui t'as bien servi par le passé",
                options: [
                    { label: "Une arme peut être rouillée mais qui t'as bien servi par le passé" }
                ]
            },
            {
                label: "Une photo souvenir de ta famille ou le souvenir de quelqu'un que tu as combattu",
                options: [
                    { label: "Une photo souvenir de ta famille" },
                    { label: "Le souvenir de quelqu'un que tu as combattu" }
                ]
            },
            {
// The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal" },
                    { label: "Antidote", lookup: "Antidote" },
                    { label: "Anti-brûle", lookup: "Burn Heal" },
                    { label: "Anti-gel", lookup: "Ice Heal" },
                    { label: "Réveil", lookup: "Awakening" }
                ]
            },
            {
                label: "2 Potions",
                grant: { label: "Super Potion", lookup: "Super Potion", quantity: 2 }
            },
            {
                label: "2 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 2 }
            }
        ]
    },  {
        slug: "nouveau-depart",
        name: "Nouveau Départ",

        intro: [
            "Assez âgé pour partir à l'aventure, trop jeune pour avoir développé la moindre compétence, mais parfaitement prêt à affronter le monde par la force s'il le faut. Les jeunes prêt à partir ne peuvent attendre de quitter leurs chez eux et commencer leur voyage.",
            "Qu'importe d'où tu viens et ce que tu as fait auparavant, il est temps de partir! Maintenant que tu es là, quittant ta maison si jeune, tu es seul, mais le monde t'ouvre les bras et peut être qu'il a besoin de jeunes pour le secouer un peu ? Qu'attendons-nous ?!"
        ],

        startingPokemon: {
            text: "Un Pokémon offert par le Professeur Pokémon de ton village, ou un Pokémon que tu connais depuis toujours et que tu viens de capturer.",
            examples: [
                "Un Bulbizarre venant du Professeur Pokémon, parfait pour commencer",
                "Un Tiplouf au fort caractère mais qui s'est laissé capturé",
                "Un Ponchiot énergique offert par ta grande tante"
            ]
        },

        personalityPrompts: [
            "Pourquoi partir maintenant et non plus tard ?",
            "Est-ce que tu es triste de quitter ton chez toi ?",
            "Qu'est-ce que tu attends le plus de ce voyage ?",
            "Quelle est ta plus grande peur ?"
        ],

        relationshipPrompts: [
            "Pourquoi est-ce que tu es la première personne à qui j'ai parlé ?",
            "Comment est-ce que j'essaye d'apprendre de tes actions ?",
            "Qu'est-ce que je trouve décourageant chez toi ?",
            "Pourquoi je veux absolument te vaincre en combat Pokémon ?"
        ],

        money: 8000,

        trait: {
            name: "Je veux être le meilleur",
            description: [
                "3/ jour, quand tu fais un jet de compétence sur un sujet qui intéresse ton personnage, fais ton jet de compétence deux fois et utilises le meilleur résultat.",
            ]
        },

        items: [
            {
                label: "Sac de Dresseur ou Explorakit",
                options: [
                    { label: "Sac de Dresseur" },
                    { label: "Explorakit" }
                ]
            },
            {
                label: "Un vélo transportable ou une vieille canne à pêche",
                options: [
                    { label: "Une vieille canne à pêche" },
                    { label: "Un vélo transportable" }
                ]
            },
            {
                label: "Un souvenir de chez toi ou un photo d'un lieu que tu veux absolument visiter un jour",
                options: [
                    { label: "Un souvenir de chez toi" },
                    { label: "Une photo d'un lieu que tu veux absolument visiter un jour" }
                ]
            },
            {
// The source table lists "Anti-para" twice; the duplicate is dropped here.
                label: "1 soin de statut au choix",
                options: [
                    { label: "Anti-para", lookup: "Paralyze Heal" },
                    { label: "Antidote", lookup: "Antidote" },
                    { label: "Anti-brûle", lookup: "Burn Heal" },
                    { label: "Anti-gel", lookup: "Ice Heal" },
                    { label: "Réveil", lookup: "Awakening" }
                ]
            },
            {
                label: "1 Potions",
                grant: { label: "Potion", lookup: "Potion", quantity: 1 }
            },
            {
                label: "6 Basic Balls",
                grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 6 }
            }
        ]
    },

    
      {
        slug: "prepose",
        name: "Préposé",

    intro: [
    "Des horaires imprévisibles et des clients malpolis ne semblent pas attirant, mais tu as tout de même décidé de travailler pendant des années dans cette industrie, jusqu'à prouver ta valeur. Bien que tes revenus ne soient pas toujours sûrs, tu as appris une grande diversité de compétences en travaillant dur.",
    "Tu as pu cuisiner, coiffer, ou aider les gens à prendre des décision sur ce qu'ils font de leurs argents. Tes compétences sont précieuses et tu as appris à te vendre comme quelqu'un de sympathique, qu'importe ce que tu ressens et la sécheresse de ton porte-monnaie."
],

    startingPokemon: {
    text: "Un Pokémon aussi énergique que toi et courant partout, ou un Pokémon qui t'aide à te détendre et ne pas paniquer.",
        examples: [
        "Un Pachirisu qui ne sait pas s'arrêter de courir et se faire remarquer",
        "Un Chochodile peut être maladroit mais plein de bonne volonté",
        "Un Picassault bien plus organisé que toi"
    ]
},

    personalityPrompts: [
        "Comment est-ce que tu évacues ton stress ?",
        "Que fais-tu quand tu t'ennuies ?",
        "Si tu pouvais te téléporter immédiatement, où irais-tu ?",
        "Quelle est ta plus grande peur ?"
    ],

        relationshipPrompts: [
    "Que fais-tu quand je perds mon calme ?",
    "Comment est-ce qu'on s'est rencontré sur mon lieu de travail ?",
    "Pourquoi est-ce que tu me regardes avec insistance ?",
    "Que dois-je faire pour que tu me respectes ?"
],

    money: 15000,

    trait: {
    name: "Passez une bonne journée",
        description: [
        "Choisis une profession dans la liste ci-dessous, ou négocie en une avec ton MJ.",
        "Quand tu fais un jet de compétence ayant un lien avec ta profession, fais ton jet de compétence deux fois et utilises le meilleur résultat."
    ],
        choiceLabel: "Passez une bonne journée",
        choices: [
        "Animateur",
        "Barman",
        "Caissier",
        "Préparateur de commandes",
        "Réceptionniste",
        "Serveur",
        "Voiturier"

    ],
// The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
        allowCustom: true
},

    items: [
        {
            label: "Sac de Diplomate ou Sac Médical",
            options: [
                { label: "Sac de Diplomate" },
                { label: "Sac Médical" }
            ]
        },
        {
            label: "Un objet perdu par une cliente dont tu ne sais que faire",
            options: [
                { label: "Un objet perdu par une cliente dont tu ne sais que faire" }
            ]
        },
        {
            label: "Un guide des meilleurs endroits où trouver du travail rapidement ou une chaise pliable que tu sors dès que tu peux te reposer",
            options: [
                { label: "Un guide des meilleurs endroits où trouver du travail rapidement" },
                { label: "Une chaise pliable que tu sors dès que tu peux te reposer" }
            ]
        },
        {
// The source table lists "Anti-para" twice; the duplicate is dropped here.
            label: "1 soin de statut au choix",
            options: [
                {label: "Anti-para", lookup: "Paralyze Heal"},
                {label: "Antidote", lookup: "Antidote"},
                {label: "Anti-brûle", lookup: "Burn Heal"},
                {label: "Anti-gel", lookup: "Ice Heal"},
                {label: "Réveil", lookup: "Awakening"}
            ]
        },
        {
            label: "1 Baie Sitrus",
            grant: { label: "Baie Sitrus", lookup: "Sitrus Berry", quantity: 1 }
        },
        {
            label: "6 Basic Balls",
            grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 6 }
        }
    ]
},      {
    slug: "privilegie",
        name: "Privilégié",

    intro: [
    "Une vie de luxe et de richesse t'as donné tout les privilèges pour vivre bien au dessus des moyens dont profites les gens normaux. Il est possible que tu vas l'hériter, ou que tu ais déjà hérité, d'un grand conglomérat de Pokémon. Peut être que tes parents possèdent une suite d'hôtel de luxe sur toutes les plages de la région. Peut être que ton argent est récent, et que tu as plein de courtiers et d'avocats qui le garde investit pour garentir un retour.",
    "Tu n'as besoin de rien et tu ne fais face qu'à peu d'obstacle. Tu risques de découvrir bien vite qu'il y a de nombreuses personnes pour qui ta richesse ne veut rien dire dans le monde des Pokémons."
],

    startingPokemon: {
    text: "Un Pokémon qui montre ton niveau social par sa rareté, ou un petit Pokémon que tu as recueilli plus jeune sans que personne ne le sache.",
        examples: [
        "Un Coupenotte acheté par tes parents pour ton anniversaire",
        "Un Rongourmand t'ayant fait pitié un hiver et que tu as aidé",
        "Un Malosse qui est aussi ton garde du corps"
    ]
},

    personalityPrompts: [
        "Dépenses-tu ton argent constamment et pour n'importe quoi ?",
        "Pourquoi te sens-tu différent des autres ?",
        "Est-ce que tu pars régulièrement en voyage à l'étranger ?",
        "Quelle est ta plus grande peur ?"
    ],

        relationshipPrompts: [
    "Pourquoi est-ce que ta parole ne m'intéresse pas ?",
    "Qu'est-ce qui me dégoute en toi ?",
    "Pourquoi est-ce que j'ai besoin de toi ?",
    "Pourquoi t'ais-je donné de l'argent à un moment ?"
],

    money: 400000,

    trait: {
    name: "Gros billets",
        description: [
        "Si une situation le permet (avec accord du MJ), vous pouvez dépenser un certain montant de Pokédollars (corruption, financement matériel...) pour permettre à tous les joueurs de réaliser des jets de compétences une deuxième fois puis en utilisant le meilleur résultat.",
        "Vous devez déduire ce montant par le RP ou d'autres actions préalables. Cet effet ne permet pas de lancer une troisième fois un jet de compétence."
    ]
},

    items: [
        {
            label: "Coffret Mode ou Sac de Diplomate",
            options: [
                { label: "Coffret Mode" },
                { label: "Sac de Diplomate" }
            ]
        },
        {
            label: "Une sélection de vêtements et/ou accessoires de très haute facture",
            options: [
                { label: "Une sélection de vêtements et/ou accessoires de très haute facture" }
            ]
        },
        {
            label: "Les clefs d'un manoir où tu passes tes vacances ou une relique apparemment très rare que tu as acheté sur un coup de tête",
            options: [
                { label: "Les clefs d'un manoir où tu passes tes vacances" },
                { label: "Une relique apparemment très rare que tu as acheté sur un coup de tête" }
            ]
        },
        {
// The source table lists "Anti-para" twice; the duplicate is dropped here.
            label: "1 soin de statut au choix",
            options: [
                { label: "Guérison", lookup: "Full Restore", quantity: 2 },
                { label: "Rappel", lookup: "Revive", quantity: 5 }
            ]
        },
        {
            label: "3 Hyper Ball",
            grant: {label: "Hyper Ball", lookup: "Hyper Ball", quantity: 3}
        },
        {
            label: "Une carte gold qui te permet de dépenser sans compter.",
            grant: { label: "Carte Gold", quantity: 1 }
        }
    ]
},      {
    slug: "responsable",
        name: "Responsable",

    intro: [
    "S'il y a bien une personne sur qui on sait qu'on peut compter, c'est toi. Depuis certainement des années, tu as ce rôle de dirigeant et tout le monde autour de toi prête attention à tes paroles et décisions.",
    "Peut être que tu ne te sens pas à la hauteur d'un tel rôle, peut être que tu l'as quitté d'ailleurs. Mais personne ne peut nier que tu as été responsable de d'autres personnes, un leader, que tu sois compétent ou non dans cette tâche. Malgré tout, cela t'as apporté des habitudes, un regard plus vif et une compréhension des codes sociaux certainement supérieure à la moyenne. Cela sera certainement utile en toute situation."
],

    startingPokemon: {
    text: "Un Pokémon responsable et sérieux comme toi... Ou au contraire, un Pokémon te donnant le sourire quand tu es assaillis de responsabilité.",
        examples: [
        "Un Goinfrex étonnemment responsable s'il n'y a pas de nourriture",
        "Un Plumeline dirigeant les autres d'une plume de fer",
        "Un Voltoutou aboyant constamment pour te faire prendre des pauses"
    ]
},

    personalityPrompts: [
        "Quelle est ta plus grande fierté ?",
        "Où vas-tu quand tu as besoin de faire une pause ?",
        "Sur quel sujet es-tu intraitable ?",
        "Quelle est ta plus grande peur ?"
    ],

        relationshipPrompts: [
    "Qu'ais-je dit qui a pu te choquer ?",
    "Qu'est-ce que je fais qui te rassure par temps difficile ?",
    "Pourquoi ais-je peur de te décevoir ?",
    "Comment est-ce que je t'impressionne ?"
],

    money: 50000,

    trait: {
    name: "De grandes responsabilités",
        description: [
        "Choisis une occupation professionnelle dans la liste ci-dessous, ou négocie en une avec ton MJ.",
        "Quand tu fais un jet de compétence ayant un lien avec ton occupation professionelle, fais ton jet de compétence deux fois et utilises le meilleur résultat."
    ],
        choiceLabel: "De grandes responsabilités",
        choices: [
        "Aristocrate",
        "Diplomate",
        "Dirigeant d'organisation",
        "Maire",
        "Médiateur",
        "Membre du gouvernement",
        "Politicien"

    ],
// The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
        allowCustom: true
},

    items: [
        {
            label: "Sac de Diplomate ou Sac de Recherche",
            options: [
                { label: "Sac de Diplomate" },
                { label: "Sac de Recherche" }
            ]
        },
        {
            label: "Un moyen de communication à distance rapide et sûr",
            options: [
                { label: "Un moyen de communication à distance rapide et sûr" }
            ]
        },
        {
            label: "Une preuve officielle de ton poste à responsabilité ou 40 000₽",
            options: [
                { label: "Une preuve officielle de ton poste à responsabilité" },
                { label: "40 000₽" }
            ]
        },
        {
// The source table lists "Anti-para" twice; the duplicate is dropped here.
            label: "3 Potions ou 2 Poképoupée",
            options: [
                {label: "Potion", lookup: "Potion", quantity: 3},
                {label: "Poképoupée, quantity: 2"}
            ]
        },
        {
            label: "2 Total Soin",
            grant: { label: "Total Soin", lookup: "Full Heal", quantity: 2 }
        },
        {
            label: "2 Basic Balls",
            grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 2 }
        }
    ]
},
{
    slug: "sbire",
        name: "Sbire",

    intro: [
    "Quand il s'agit de loi, tu ne lui accordes pas le moindre respect. Que tu sois un sbire qui travaille sous l'influence d'un culte, ou un chef de la pègre, tes contacts criminels t'ont tenus au courant de qui a le pouvoir dans quelle partie du monde et comment en tirer parti.",
    "Tandis que certaines teams évident le feu des projecteurs, le monde entier sait qu'elles sont là parce que d'autres larges organisations ont agit dans le but de le conquérir, comme la Team Plasma ou la Team Rocket. Qu'importe la vie que tu as laissé derrière toi, ou si tu es toujours un membre actif de plans précis, ta loyauté t'as toujours bien servie."
],

    startingPokemon: {
    text: "Un Pokémon agressif prêt à attaquer ou un Pokémon discret faisant les poches des malheureux.",
        examples: [
        "Un Gloupti prêt à manger le premier venu",
        "Un Cornèbre voleur et un peu farceur",
        "Un Bébécaille abandonné n'ayant plus rien à perdre"
    ]
},

    personalityPrompts: [
        "Pourquoi est-ce que tu as choisis cette organisation en particulier ?",
        "Où est-ce que tu te vois dans 5 ans ?",
        "Quel est ta relation avec le danger ?",
        "Quelle est ta plus grande peur ?"
    ],

        relationshipPrompts: [
    "Nous nous sommes déjà croisé dans de mauvaises circonstances, lesquelles ?",
    "Pourquoi est-ce que tu m'admires ? Nan mais sérieux pourquoi ?",
    "Pourquoi est-ce que tu trouves que j'agis dangereusement ?",
    "Qu'est-ce qui te fait dire que je suis, ou non, de confiance ?"
],

    money: 10000,

    trait: {
    name: "Talent criminel",
        description: [
        "Choisis un historique criminel dans la liste ci-dessous, ou négocie en une avec ton MJ.",
        "Quand tu fais un jet de compétence ayant un lien avec ton historique criminel, fais ton jet de compétence deux fois et utilises le meilleur résultat.",
        "De plus, si tu faisais/fais parti d'une large organisation criminelle, tu as un contact dans cette organisation avec laquelle tu peux communiquer pour découvrir ce qu'il se passe dans l'organisation et ce que tu devrais faire pour les aider. Discutes en avec ton MJ avant la campagne pour créer ce PNJ."
    ],
        choiceLabel: "Talent criminel",
        choices: [
        "Braconnier",
        "Cyber criminel",
        "Homme de main",
        "Tueur à gage",
        "Voleur"

    ],
// The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
        allowCustom: true
},

    items: [
        {
            label: "Sac de Dresseur ou Sac de Recherche",
            options: [
                { label: "Sad de Dresseur" },
                { label: "Sac de Recherche" }
            ]
        },
        {
            label: "Un objet volé bien qu'il n'ait que peu de valeur ou soit inutilisable",
            options: [
                { label: "Un objet volé bien qu'il n'ait que peu de valeur ou soit inutilisable" }
            ]
        },
        {
            label: "Un objet utile à tes activités de sbire qui n'est pas une arme",
            options: [
                { label: "Un objet utile à tes activités de sbire qui n'est pas une arme" }
            ]
        },
        {
// The source table lists "Anti-para" twice; the duplicate is dropped here.
            label: "1 Hyper Potion ou 1 Total Soin",
            options: [
                {label: "Hyper Potion", lookup: "Hyper Potion"},
                {label: "Total Soin", lookup: "Full Heal"}
            ]
        },
        {
            label: "3 Potions",
            grant: { label: "Potion", lookup: "Potion", quantity: 3 }
        },
        {
            label: "6 Basic Balls",
            grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 6 }
        }
        ]
},      {
    slug: "spiritualiste",
        name: "Spiritualiste",

    intro: [
    "Les secrets du monde des Pokémons ne seront jamais tous découvert. Les gens dans le monde entier y croient et prient différents Pokémon légendaires, Pokémon mythiques, et même vénèrent certains humains comme des prophètes d'un ancien temps.",
    "De plus, le monde spirituel après la mort se manifeste et peut être étudié, menant à de nombreux pratiquants religieux qui deviennent aussi médiums, sorciers ou communiquant de magie. Ton temps est passé à étudier dans une communauté sacrée qui t'as mené à de nombreux lieux spirituels, ce qui sera sans aucun doute utile."
],

    startingPokemon: {
    text: "Un Pokémon qui partage tes croyances et te suit partout ou un qui est là pour t'aider à partager la bonne parole.",
        examples: [
        "Un Brocélôme qui te suis depuis des années sans savoir pourquoi",
        "Un Lixy qui éclaire ton chemin en cas de besoin",
        "Un Grondogue un peu agressif mais qui veut toujours bien faire"
    ]
},

    personalityPrompts: [
        "Quel est l'élément qui a créé ta foi ?",
        "Comment approches-tu les gens ne partageant pas tes croyances ?",
        "Pourquoi tu aimes te lever le matin ?",
        "Quelle est ta plus grande peur ?"
    ],

        relationshipPrompts: [
    "Pourquoi est-ce que je t'inspire de l'espoir ?",
    "Qu'est-ce qui te dérange dans mes pratiques quotidiennes ?",
    "Pourquoi est-ce que tu cherches à me parler constamment ?",
    "Qu'ai-je dis qui t'as vexé ?"
],

    money: 10000,

    trait: {
    name: "Guide spirituel",
        description: [
        "Choisis jusqu'à deux êtres ou systèmes religieux dans lesquels tu crois et fais parti de la communauté.",
        "Quand tu fais un jet de compétence ayant un lien avec ces croyances spirituelles, fais ton jet de compétence deux fois et utilises le meilleur résultat.",
        "De plus, si tu prie ou médite pour au moins une minute avant de faire un jet, tu peux utiliser Guide spirituel sur ce jet de compétence s'il est logique avec la situation."
    ],
        choiceLabel: "Guide spirituel",
        choices: [
        "Adorateur du Prisme",
        "Croyant d'Arceus",
        "Moine de Regigigas",
        "Religieux du Soleil et de la Lune",
        "Secte de Giratina",
        "Spirituel des Dragons de la création"

    ],
// The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
        allowCustom: true
},

    items: [
        {
            label: "Explorakit ou Sac Médical",
            options: [
                { label: "Explorakit" },
                { label: "Sac Médical" }
            ]
        },
        {
            label: "Un foulard permettant de te reconnaître comme membre ta religion",
            options: [
                { label: "Un foulard permettant de te reconnaître comme membre ta religion" }
            ]
        },
        {
            label: "Un petit objet essentiel pour tes prières ou des écrits de ta religion que tu relis jusqu'à plus soif",
            options: [
                { label: "Un petit objet essentiel pour tes prières" },
                { label: "Des écrits de ta religion que tu relis jusqu'à plus soif" }
            ]
        },
        {
// The source table lists "Anti-para" twice; the duplicate is dropped here.
            label: "2 soin de statut au choix",
            options: [
                {label: "Anti-para", lookup: "Paralyze Heal", quantity: 2},
                {label: "Antidote", lookup: "Antidote", quantity: 2},
                {label: "Anti-brûle", lookup: "Burn Heal", quantity: 2},
                {label: "Anti-gel", lookup: "Ice Heal", quantity: 2},
                {label: "Réveil", lookup: "Awakening", quantity: 2}
            ]
        },
        {
            label: "2 Rappels",
            grant: { label: "Rappel", lookup: "Revive", quantity: 2 }
        },
        {
            label: "4 Basic Balls",
            grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 4 }
        }
    ]
},  {
    slug: "technicien",
        name: "Technicien",

    intro: [
    "L'expertise de la programmation et de l'ingénierie t'as permis, après de longues années d'étude, d'avoir un train de vie confortable. ",
    "Que tu créés des logiciels utilisés par des millions de personnes, ou bien que tu travailles dans un système de maintenance de ligne d'assemblage, tu as découvert un paquet de compétences qui seront toujours utiles en technologie dans le monde des Pokémons."
],

    startingPokemon: {
    text: "Un Pokémon tout aussi passionné par l'électronique que toi, ou un Pokémon qui s'emmêle dans les câbles aussi souvent qu'il est attachant.",
        examples: [
        "Un Porygon pour qui tu développes des mises à jour",
        "Un Dedenne qui veut comprendre absolument tout ce que tu fais",
        "Un Mascaïman qui a promis d'arrêter de mordre tes installations"
    ]
},

    personalityPrompts: [
        "Pourquoi est-ce que tu préfères vivre dans un lieu plutôt qu'un autre ?",
        "Est-ce que tu as déjà piraté quelque chose, volontairement ou non ?",
        "Qu'est-ce qui t'énerve le plus chez les autres ?",
        "Quelle est ta plus grande peur ?"
    ],

        relationshipPrompts: [
    "Qu'est-ce que j'ai réparé ou simplifié pour toi ?",
    "Pourquoi est-ce que tu sembles étonné par ma présence ?",
    "Qu'est-ce que j'ai fait qui t'interroge maintenant constamment ?",
    "Comment est-ce que je connais ton identité sans t'avoir rencontré ?"
],

    money: 60000,

    trait: {
    name: "Savoir-faire technique",
        description: [
        "Choisis une profession possible dans la liste ci-dessous, ou négocie en une avec ton MJ. ",
        "Quand tu fais un jet de compétence ayant un lien avec ton occupation, fais ton jet de compétence deux fois et utilises le meilleur résultat."
    ],
        choiceLabel: "Savoir-faire technique",
        choices: [
        "Administrateur réseau",
        "Data scientist",
        "Ingénieur autobile",
        "Ingénieur informatique",
        "Ingénieur en robotique",
        "Programmeur en cybersécurité"

    ],
// The sheet says "ou négocie-en une avec ton MJ", so the list is not closed.
        allowCustom: true
},

    items: [
        {
            label: "Sac de Recherche ou Sac de Voyageur",
            options: [
                { label: "Sac de Recherche" },
                { label: "Sac de Voyageur" }
            ]
        },
        {
            label: "Un mini ordinateur non connecté à internet mais toujours pratique",
            options: [
                { label: "Un mini ordinateur non connecté à internet mais toujours pratique" }
            ]
        },
        {
            label: "Un taser un peu faiblard que tu veux améliorer ou un étrange CD que tu n'arrives pas à décrypter",
            options: [
                { label: "Un taser un peu faiblard que tu veux améliorer" },
                { label: "Un étrange CD que tu n'arrives pas à décrypter" }
            ]
        },
        {
// The source table lists "Anti-para" twice; the duplicate is dropped here.
            label: "1 soin de statut au choix",
            options: [
                {label: "Anti-para", lookup: "Paralyze Heal"},
                {label: "Antidote", lookup: "Antidote"},
                {label: "Anti-brûle", lookup: "Burn Heal"},
                {label: "Anti-gel", lookup: "Ice Heal"},
                {label: "Réveil", lookup: "Awakening"}
            ]
        },
        {
            label: "2 Potions",
            grant: { label: "Potion", lookup: "Potion", quantity: 2 }
        },
        {
            label: "6 Basic Balls",
            grant: { label: "Basic Ball", lookup: "Basic Ball", quantity: 6 }
        }
    ]
    },
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
