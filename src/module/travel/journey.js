/**
 * Travel macro.
 *
 * The party's Movement Mode (Exploration, Slow, Normal, Fast) sets its speed; terrain
 * (with its path) and condition multiply it, and the duration gives the distance, all
 * previewed on every change. Confirming posts the distance to the GM with one square per
 * km: ticking squares reports the ground and the hours actually covered.
 *
 * Every choice is remembered between uses, per user. The mode is shared with the
 * Navigator macro, which applies its effects to the Navigation roll.
 */

import { localize } from "../i18n.js";
import { conditionName, escape, formatNumber, multiplier, paceEffect, paceName, pathName, terrainName } from "./labels.js";
import { journeyProgress, planJourney } from "./journey-math.js";
import { CONDITIONS, DEFAULT_PACE, MAX_HOURS, PATHS, TERRAINS, TRAVEL_PACES, paceById } from "./tables.js";

const CONFIG_FLAG = "journeyConfig";
const CARD_FLAG = "journey";
const K = "PTU.Epopee.Travel.Journey";

function defaultConfig() {
    return {
        terrainId: TERRAINS[0].id,
        pathId: PATHS[0],
        conditionId: CONDITIONS[0].id,
        paceId: DEFAULT_PACE,
        hours: 8
    };
}

/**
 * The saved configuration. Fields from the old layout (party slots, haste hours, modes)
 * are simply dropped.
 */
function loadConfig() {
    const saved = game.user.getFlag("pe", CONFIG_FLAG) ?? {};
    const defaults = defaultConfig();
    return Object.fromEntries(Object.keys(defaults).map((key) => [key, saved[key] ?? defaults[key]]));
}

/** The Movement Mode currently chosen, as the Navigator macro reads it. */
function currentPace() {
    return paceById(game.user.getFlag("pe", CONFIG_FLAG)?.paceId);
}

/** Change the Movement Mode, keeping the rest of the saved configuration. */
async function setCurrentPace(paceId) {
    const config = { ...loadConfig(), paceId: paceById(paceId).id };
    await game.user.setFlag("pe", CONFIG_FLAG, config);
}

class JourneyApp extends Application {
    constructor(opts) {
        super(opts);
        this.config = loadConfig();
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "pe-journey",
            classes: ["pe", "travel-app"],
            template: "systems/pe/static/templates/apps/travel-journey.hbs",
            width: 480,
            height: "auto"
        });
    }

    get title() {
        return localize(`${K}.Title`);
    }

    getData() {
        const plan = planJourney(this.config);
        return {
            paces: TRAVEL_PACES.map((p) => ({
                value: p.id,
                label: localize(`${K}.PaceOption`, { name: paceName(p), value: formatNumber(p.kmPerHour) }),
                selected: p.id === plan.pace.id
            })),
            paceEffect: paceEffect(plan.pace),
            terrains: TERRAINS.map((t) => ({ value: t.id, label: terrainName(t), selected: t.id === plan.terrain.id })),
            paths: PATHS.map((p) => ({
                value: p,
                label: `${pathName(p)} (${multiplier(plan.terrain.speed[p])})`,
                selected: p === plan.path
            })),
            conditions: CONDITIONS.map((c) => ({
                value: c.id,
                label: `${conditionName(c)} (${multiplier(c.speed)})`,
                selected: c.id === plan.condition.id
            })),
            hours: Array.from({ length: MAX_HOURS }, (_, i) => i + 1)
                .map((h) => ({ value: h, label: h, selected: h === plan.hours })),
            preview: {
                base: formatNumber(plan.baseKmPerHour),
                terrain: multiplier(plan.terrain.speed[plan.path]),
                condition: multiplier(plan.condition.speed),
                pace: formatNumber(plan.kmPerHour),
                hours: plan.hours,
                km: formatNumber(plan.km)
            },
            canConfirm: plan.km > 0
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find("select").on("change", () => this._read(html));
        html.find("button.pe-journey-confirm").on("click", (event) => {
            event.preventDefault();
            this._confirm();
        });
    }

    async _read(html) {
        Object.assign(this.config, {
            paceId: html.find("select[name=paceId]").val(),
            terrainId: html.find("select[name=terrainId]").val(),
            pathId: html.find("select[name=pathId]").val(),
            conditionId: html.find("select[name=conditionId]").val(),
            hours: Number(html.find("select[name=hours]").val()) || 1
        });
        await game.user.setFlag("pe", CONFIG_FLAG, this.config);
        this.render(false);
    }

    async _confirm() {
        const plan = planJourney(this.config);
        if (!(plan.km > 0)) return;

        const card = {
            km: plan.km,
            hours: plan.hours,
            squares: plan.squares,
            checked: 0,
            kmPerHour: plan.kmPerHour,
            paceId: plan.pace.id,
            terrainId: plan.terrain.id,
            pathId: plan.path,
            conditionId: plan.condition.id
        };

        // GM only: the travel card is for planning, the players do not see it.
        await ChatMessage.create({
            content: journeyCardHTML(card),
            speaker: { alias: localize(`${K}.Title`) },
            whisper: ChatMessage.getWhisperRecipients("GM").map((u) => u.id),
            flags: { pe: { [CARD_FLAG]: card } }
        });
    }
}

/**
 * The chat card. Rebuilt from its flags on every tick, so the stored HTML and the state
 * never drift apart.
 */
function journeyCardHTML(card) {
    const terrain = TERRAINS.find((t) => t.id === card.terrainId) ?? TERRAINS[0];
    const condition = CONDITIONS.find((c) => c.id === card.conditionId) ?? CONDITIONS[0];
    const pace = paceById(card.paceId);
    const progress = journeyProgress(card, card.checked);

    const rows = [
        [localize(`${K}.Pace`), localize(`${K}.PaceOption`, { name: escape(paceName(pace)), value: formatNumber(pace.kmPerHour) })],
        [localize(`${K}.Terrain`), `${escape(terrainName(terrain))}, ${escape(pathName(card.pathId))} (${multiplier(terrain.speed[card.pathId] ?? "1")})`],
        [localize(`${K}.Condition`), `${escape(conditionName(condition))} (${multiplier(condition.speed)})`],
        [localize(`${K}.FinalPace`), localize(`${K}.KmPerHour`, { value: formatNumber(card.kmPerHour) })],
        [localize(`${K}.Duration`), localize(`${K}.Hours`, { hours: card.hours })]
    ];

    const cells = Array.from({ length: card.squares }, (_, i) =>
        `<span class="pe-journey-cell${i < progress.checked ? " checked" : ""}" data-index="${i}"></span>`).join("");

    return `<div class="pe-travel-card pe-journey-card">
        <h3>${localize(`${K}.CardTitle`)}</h3>
        <p class="pe-travel-outcome">${localize(`${K}.CardDistance`, { km: formatNumber(card.km) })}</p>
        <table>${rows.map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join("")}</table>
        <p class="pe-muted">${escape(paceEffect(pace))}</p>
        <div class="pe-journey-cells">${cells}</div>
        <div class="pe-journey-progress">
            <span>${localize(`${K}.ProgressKm`, { done: formatNumber(progress.kmDone), planned: formatNumber(card.km) })}</span>
            <span>${localize(`${K}.ProgressHours`, { done: formatNumber(progress.hoursUsed), planned: card.hours })}</span>
        </div>
    </div>`;
}

/**
 * Chat hook: a click on square N ticks it and everything before it; clicking the last
 * ticked square unticks it - the same control as the Loyalty row. Only someone who may
 * edit the message (its author, a GM) can tick.
 */
function activateJourneyCard(message, html) {
    const card = message.getFlag("pe", CARD_FLAG);
    if (!card) return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;

    const editable = message.canUserModify(game.user, "update");
    root.querySelector(".pe-journey-cells")?.classList.toggle("editable", editable);
    if (!editable) return;

    for (const cell of root.querySelectorAll(".pe-journey-cell")) {
        cell.addEventListener("click", async (event) => {
            event.preventDefault();
            const index = Number(cell.dataset.index);
            const checked = index + 1 === card.checked ? index : index + 1;
            const next = { ...card, checked };
            await message.update({ content: journeyCardHTML(next), [`flags.pe.${CARD_FLAG}.checked`]: checked });
        });
    }
}

function openJourney() {
    if (!game.user.isGM) return ui.notifications.warn(localize("PTU.Epopee.Travel.GmOnly"));
    new JourneyApp().render(true);
}

export { openJourney, journeyCardHTML, activateJourneyCard, currentPace, setCurrentPace };
