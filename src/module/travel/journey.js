/**
 * Travel macro.
 *
 * Up to six characters with their Movement; the slowest sets the pace and is
 * highlighted as it changes. Terrain (with its path), condition, duration, hours in haste
 * and movement modes each multiply the pace, and the result is previewed on every
 * change. Confirming posts the distance to chat with one square per km: ticking squares
 * reports the ground and the hours actually covered.
 *
 * Every choice is remembered between uses, per user.
 */

import { localize } from "../i18n.js";
import {
    conditionName, escape, formatNumber, modeName, multiplier, partyTrainers, pathName, terrainName
} from "./labels.js";
import { availableModes, journeyProgress, planJourney } from "./journey-math.js";
import { CONDITIONS, MAX_HOURS, PARTY_FOLDER, PARTY_SLOTS, PATHS, SPEED_CHOICES, TERRAINS, TRAVEL_MODES } from "./tables.js";

const CONFIG_FLAG = "journeyConfig";
const CARD_FLAG = "journey";
const K = "PTU.Epopee.Travel.Journey";

function defaultConfig() {
    return {
        slots: Array.from({ length: PARTY_SLOTS }, () => ({ actorId: "", speed: 0 })),
        terrainId: TERRAINS[0].id,
        pathId: PATHS[0],
        conditionId: CONDITIONS[0].id,
        hours: 8,
        hasteHours: 0,
        modes: []
    };
}

function loadConfig() {
    const saved = game.user.getFlag("pe", CONFIG_FLAG) ?? {};
    const config = foundry.utils.mergeObject(defaultConfig(), saved, { inplace: false });
    // A saved list from an older layout may be shorter: pad it back to six slots.
    config.slots = Array.from({ length: PARTY_SLOTS }, (_, i) => ({
        actorId: config.slots?.[i]?.actorId ?? "",
        speed: Number(config.slots?.[i]?.speed) || 0
    }));
    return config;
}

const options = (values, selected, label = (v) => v) =>
    values.map((value) => ({ value, label: label(value), selected: String(value) === String(selected) }));

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
            width: 520,
            height: "auto"
        });
    }

    get title() {
        return localize(`${K}.Title`);
    }

    getData() {
        const { folderFound, actors } = partyTrainers();
        const plan = planJourney(this.config);
        const slowestIndices = new Set(plan.slowest?.indices ?? []);
        const actorName = (id) => actors.find((a) => a.id === id)?.name ?? "";

        const slots = this.config.slots.map((slot, index) => ({
            index,
            number: index + 1,
            slowest: slowestIndices.has(index),
            actors: [{ value: "", label: "—", selected: !slot.actorId }]
                .concat(actors.map((a) => ({ value: a.id, label: a.name, selected: a.id === slot.actorId }))),
            speeds: [{ value: 0, label: "—", selected: !slot.speed }].concat(options(SPEED_CHOICES, slot.speed))
        }));

        const slowestNames = (plan.slowest?.indices ?? [])
            .map((i) => actorName(this.config.slots[i].actorId) || localize(`${K}.Slot`, { n: i + 1 }));

        const modes = TRAVEL_MODES.map((mode) => {
            const allowed = availableModes(plan.terrain.id, plan.path).includes(mode);
            return {
                id: mode.id,
                label: `${modeName(mode)} (${multiplier(mode.speed)})`,
                checked: plan.modes.includes(mode),
                disabled: !allowed,
                group: mode.group ?? ""
            };
        });

        return {
            folderFound,
            folderWarning: localize(`${K}.NoFolder`, { folder: PARTY_FOLDER }),
            slots,
            slowest: plan.slowest
                ? localize(`${K}.Slowest`, { names: slowestNames.join(", "), speed: plan.slowest.speed })
                : localize(`${K}.NoMembers`),
            hasSlowest: !!plan.slowest,
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
            hours: options(Array.from({ length: MAX_HOURS }, (_, i) => i + 1), plan.hours),
            haste: options(Array.from({ length: plan.hours + 1 }, (_, i) => i), plan.hasteHours),
            hasModes: modes.length > 0,
            modes,
            preview: {
                base: formatNumber(plan.baseKmPerHour),
                terrain: multiplier(plan.terrain.speed[plan.path]),
                condition: multiplier(plan.condition.speed),
                modes: `x${formatNumber(plan.modesMultiplier)}`,
                pace: formatNumber(plan.kmPerHour),
                hours: plan.hours,
                haste: plan.hasteHours,
                km: formatNumber(plan.km)
            },
            canConfirm: plan.km > 0
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Exclusive modes: ticking one drops the others of its group before reading.
        html.find("input[name=mode]").on("change", (event) => {
            const box = event.currentTarget;
            if (box.checked && box.dataset.group) {
                html.find(`input[name=mode][data-group="${box.dataset.group}"]`).not(box).prop("checked", false);
            }
        });

        html.find("select, input").on("change", () => this._read(html));
        html.find("button.pe-journey-confirm").on("click", (event) => {
            event.preventDefault();
            this._confirm();
        });
    }

    async _read(html) {
        const config = this.config;
        config.slots = config.slots.map((_, i) => ({
            actorId: html.find(`select[name="slot-${i}-actor"]`).val() ?? "",
            speed: Number(html.find(`select[name="slot-${i}-speed"]`).val()) || 0
        }));
        config.terrainId = html.find("select[name=terrainId]").val();
        config.pathId = html.find("select[name=pathId]").val();
        config.conditionId = html.find("select[name=conditionId]").val();
        config.hours = Number(html.find("select[name=hours]").val()) || 1;
        config.hasteHours = Math.min(Number(html.find("select[name=hasteHours]").val()) || 0, config.hours);
        config.modes = html.find("input[name=mode]:checked").map((_, el) => el.value).get();

        await game.user.setFlag("pe", CONFIG_FLAG, config);
        this.render(false);
    }

    async _confirm() {
        const plan = planJourney(this.config);
        if (!(plan.km > 0)) return ui.notifications.warn(localize(`${K}.NoMembers`));

        const { actors } = partyTrainers();
        const names = (plan.slowest?.indices ?? [])
            .map((i) => actors.find((a) => a.id === this.config.slots[i].actorId)?.name)
            .filter(Boolean);

        const card = {
            km: plan.km,
            hours: plan.hours,
            hasteHours: plan.hasteHours,
            squares: plan.squares,
            checked: 0,
            kmPerHour: plan.kmPerHour,
            terrainId: plan.terrain.id,
            pathId: plan.path,
            conditionId: plan.condition.id,
            modeIds: plan.modes.map((m) => m.id),
            slowest: plan.slowest ? { names, speed: plan.slowest.speed } : null
        };

        await ChatMessage.create({
            content: journeyCardHTML(card),
            speaker: { alias: localize(`${K}.Title`) },
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
    const modes = TRAVEL_MODES.filter((m) => card.modeIds?.includes(m.id));
    const progress = journeyProgress(card, card.checked);

    const rows = [
        [localize(`${K}.Terrain`), `${escape(terrainName(terrain))}, ${escape(pathName(card.pathId))} (${multiplier(terrain.speed[card.pathId] ?? "1")})`],
        [localize(`${K}.Condition`), `${escape(conditionName(condition))} (${multiplier(condition.speed)})`]
    ];
    if (modes.length) rows.push([localize(`${K}.Modes`), modes.map((m) => `${escape(modeName(m))} (${multiplier(m.speed)})`).join(", ")]);
    if (card.slowest) rows.push([localize(`${K}.SlowestShort`), `${escape(card.slowest.names.join(", ") || "—")} (${card.slowest.speed})`]);
    rows.push([localize(`${K}.Pace`), localize(`${K}.KmPerHour`, { value: formatNumber(card.kmPerHour) })]);
    rows.push([localize(`${K}.Duration`), localize(`${K}.HoursWithHaste`, { hours: card.hours, haste: card.hasteHours })]);

    const cells = Array.from({ length: card.squares }, (_, i) =>
        `<span class="pe-journey-cell${i < progress.checked ? " checked" : ""}" data-index="${i}"></span>`).join("");

    return `<div class="pe-travel-card pe-journey-card">
        <h3>${localize(`${K}.CardTitle`)}</h3>
        <p class="pe-travel-outcome">${localize(`${K}.CardDistance`, { km: formatNumber(card.km) })}</p>
        <table>${rows.map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join("")}</table>
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

export { openJourney, journeyCardHTML, activateJourneyCard };
