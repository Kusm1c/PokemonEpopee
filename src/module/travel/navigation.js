/**
 * Navigator macro.
 *
 * The GM picks the Navigator (a Trainer of "00 PJs") and the terrain, which sets the
 * Navigation DC. Rolling sends the request to the player who owns that Trainer: their
 * client opens the character's own Survival check - with its usual dialog, so it can be
 * improved like any roll - locked to a blind GM roll, so the player cannot make it
 * public. The total comes back to the GM, who alone sees whether the party is lost and,
 * on a failure, the 1d10 deviation.
 *
 * With no owning player connected, the GM's client makes the same roll.
 */

import { PTUModifier } from "../actor/modifiers.js";
import { localize } from "../i18n.js";
import { escape, partyTrainers, terrainName } from "./labels.js";
import { emitSocket, onSocket } from "./socket.js";
import { DEVIATION_FORMULA, NAVIGATION_BONUSES, NAVIGATION_SKILL, PARTY_FOLDER, TERRAINS } from "./tables.js";

const CONFIG_FLAG = "navigationConfig";
const K = "PTU.Epopee.Travel.Navigation";

class NavigationRollApp extends Application {
    constructor(options) {
        super(options);
        // "Garder en mémoire tous les choix faits lors de la config de la macro. (Acteur
        // choisi, Terrain)". Equipment is picked per roll, so it is not remembered.
        const saved = game.user.getFlag("pe", CONFIG_FLAG) ?? {};
        this.config = { actorId: saved.actorId ?? "", terrainId: saved.terrainId ?? TERRAINS[0].id };
        this.bonusIds = [];
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "pe-navigation-roll",
            classes: ["pe", "travel-app"],
            template: "systems/pe/static/templates/apps/travel-navigation.hbs",
            width: 400,
            height: "auto"
        });
    }

    get title() {
        return localize(`${K}.Title`);
    }

    getData() {
        const { folderFound, actors } = partyTrainers();
        const terrain = TERRAINS.find((t) => t.id === this.config.terrainId) ?? TERRAINS[0];
        return {
            folderFound,
            trainers: actors.map((a) => ({ id: a.id, name: a.name, selected: a.id === this.config.actorId })),
            terrains: TERRAINS.map((t) => ({ id: t.id, name: terrainName(t), selected: t.id === terrain.id })),
            dc: terrain.navigationDC,
            bonuses: NAVIGATION_BONUSES.map((b) => ({
                id: b.id, value: b.value,
                label: localize(`${K}.Bonus.${b.id}`),
                checked: this.bonusIds.includes(b.id)
            })),
            canRoll: actors.some((a) => a.id === this.config.actorId),
            folder: localize(`${K}.NoFolder`, { folder: PARTY_FOLDER }),
            noTrainers: localize(`${K}.NoTrainers`, { folder: PARTY_FOLDER })
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find("select, input").on("change", () => this._read(html));
        html.find("button.pe-navigation-roll").on("click", (event) => {
            event.preventDefault();
            this._roll();
        });
    }

    async _read(html) {
        this.config.actorId = html.find("select[name=actorId]").val() ?? "";
        this.config.terrainId = html.find("select[name=terrainId]").val() ?? TERRAINS[0].id;
        this.bonusIds = html.find("input[name=bonus]:checked").map((_, el) => el.value).get();
        await game.user.setFlag("pe", CONFIG_FLAG, this.config);
        this.render(false);
    }

    async _roll() {
        const actor = game.actors.get(this.config.actorId);
        if (!actor) return ui.notifications.warn(localize(`${K}.NoActor`));
        const terrain = TERRAINS.find((t) => t.id === this.config.terrainId) ?? TERRAINS[0];
        await requestNavigationRoll({ actor, terrain, bonusIds: [...this.bonusIds] });
    }
}

/** The player who should roll for this Trainer: its assigned player first, then any owner. */
function navigatorPlayer(actor) {
    const owners = game.users.filter((u) => u.active && !u.isGM && actor.testUserPermission(u, "OWNER"));
    return owners.find((u) => u.character?.id === actor.id) ?? owners[0] ?? null;
}

/** GM side: hand the roll to the owning player, or make it here if none is connected. */
async function requestNavigationRoll({ actor, terrain, bonusIds }) {
    const request = {
        requestId: foundry.utils.randomID(),
        gmId: game.user.id,
        actorUuid: actor.uuid,
        terrainId: terrain.id,
        dc: terrain.navigationDC,
        bonusIds
    };

    const player = navigatorPlayer(actor);
    if (!player) {
        ui.notifications.info(localize(`${K}.RollingSelf`, { actor: actor.name }));
        const total = await performNavigationRoll(request);
        if (total === null) return;
        return postNavigationResult({ ...request, total });
    }

    emitSocket("navigation.request", { ...request, userId: player.id });
    ui.notifications.info(localize(`${K}.Requested`, { user: player.name, actor: actor.name }));
}

/**
 * Roll the Trainer's Survival check, blind and locked. Runs on whichever client rolls.
 *
 * @returns {Promise<number|null>} the total, or null if the roll did not happen
 */
async function performNavigationRoll({ actorUuid, terrainId, bonusIds }) {
    const actor = await fromUuid(actorUuid);
    const skill = actor?.attributes?.skills?.[NAVIGATION_SKILL];
    if (!skill) {
        ui.notifications.error(localize(`${K}.NoSkill`, { actor: actor?.name ?? "?" }));
        return null;
    }

    const terrain = TERRAINS.find((t) => t.id === terrainId) ?? TERRAINS[0];
    const modifiers = NAVIGATION_BONUSES
        .filter((b) => bonusIds.includes(b.id))
        .map((b) => new PTUModifier({ slug: `navigation-${b.id}`, label: localize(`${K}.Bonus.${b.id}`), modifier: b.value }));

    const roll = await skill.roll({
        rollMode: CONST.DICE_ROLL_MODES.BLIND,
        lockRollMode: true,
        modifiers,
        title: localize(`${K}.RollTitle`, { terrain: terrainName(terrain) })
    });
    return Number.isFinite(roll?.total) ? roll.total : null;
}

/** GM side: whisper the outcome to the GMs, with the deviation on a failure. */
async function postNavigationResult({ actorUuid, terrainId, dc, total }) {
    const actor = await fromUuid(actorUuid);
    const terrain = TERRAINS.find((t) => t.id === terrainId) ?? TERRAINS[0];
    const success = total >= dc;
    const deviation = success ? null : await new Roll(DEVIATION_FORMULA).evaluate();

    const rows = [
        [localize(`${K}.Terrain`), escape(terrainName(terrain))],
        [localize(`${K}.DC`), dc],
        [localize(`${K}.Total`), total]
    ];
    if (deviation) rows.push([localize(`${K}.Deviation`), `${deviation.total} <span class="pe-muted">(${DEVIATION_FORMULA})</span>`]);

    const content = `<div class="pe-travel-card">
        <h3>${escape(localize(`${K}.ResultTitle`, { actor: actor?.name ?? "?" }))}</h3>
        <p class="pe-travel-outcome ${success ? "success" : "failure"}">${localize(`${K}.${success ? "Success" : "Failure"}`)}</p>
        <table>${rows.map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join("")}</table>
    </div>`;

    await ChatMessage.create({
        content,
        speaker: { alias: localize(`${K}.Title`) },
        whisper: ChatMessage.getWhisperRecipients("GM").map((u) => u.id)
    });
}

/* Socket handlers ------------------------------------------------------------------- */

// Player side: ask, then roll as the character.
onSocket("navigation.request", async (data) => {
    if (data.userId !== game.user.id) return;
    const actor = await fromUuid(data.actorUuid);

    const accepted = await Dialog.prompt({
        title: localize(`${K}.Title`),
        content: `<p>${escape(localize(`${K}.PromptBody`, { actor: actor?.name ?? "?" }))}</p>`,
        label: localize(`${K}.Roll`),
        rejectClose: true,
        callback: () => true
    }).catch(() => false);

    const total = accepted ? await performNavigationRoll(data) : null;
    emitSocket("navigation.result", { ...data, total, userName: game.user.name });
});

// GM side: only the GM who asked resolves it, so two GMs do not post it twice.
onSocket("navigation.result", async (data) => {
    if (data.gmId !== game.user.id) return;
    if (data.total === null || data.total === undefined) {
        return ui.notifications.warn(localize(`${K}.Declined`, { user: data.userName ?? "?" }));
    }
    await postNavigationResult(data);
});

function openNavigationRoll() {
    if (!game.user.isGM) return ui.notifications.warn(localize("PTU.Epopee.Travel.GmOnly"));
    new NavigationRollApp().render(true);
}

export { openNavigationRoll, requestNavigationRoll, performNavigationRoll };
