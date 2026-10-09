import { sluggify } from "../../../util/misc.js";
import { CheckModifier, PTUModifier, StatisticModifier } from "../../actor/modifiers.js";
import { PTUCondition } from "../../item/index.js";
import { ALL_STATUS_DEFINITIONS } from "../../statuses/definitions.js";
import { esquiveValue, precisionBonus } from "../../stats/secondary.js";
import { ACCURACY_DIE } from "../../combat-math/config.js";
import { PTUDiceCheck } from "./check.js";
import { AttackRoll } from "./rolls/attack-roll.js";

class PTUAttackCheck extends PTUDiceCheck {

    get isSelfAttack() {
        return this._isSelfAttack ??= this.selectors.includes("self-attack");
    }
    get isRangedAttack() {
        return this._isRangedAttack ??= this.selectors.includes("ranged-attack");
    }

    get rollCls() {
        return AttackRoll;
    }

    /* -------------------------------------------- */
    /* Preperation                                  */
    /* -------------------------------------------- */

    /** @override */
    async prepareContexts(attackStatistic = null) {
        if (this.isSelfAttack) {
            const context = await this.actor.getContext({
                selfToken: this.token,
                targetToken: this.token,
                selfItem: this.item,
                domains: this.context.domains,
                statistic: attackStatistic
            });
            this._contexts = new Collection([[context.actor.uuid, context]]);
        }
        else await super.prepareContexts(attackStatistic);
    }

    /**
     * @override
     * @returns {PTUAttackCheck}
     */
    prepareModifiers() {
        super.prepareModifiers();

        // Epopee: the AC is no longer a penalty on the roll - it is part of the number to
        // beat, with the target's Esquive (see execute). A move with no AC still cannot
        // miss, which is what the Infinity modifier means to the outcome check.
        if (isNaN(Number(this.item.system.ac))) {
            this.modifiers.unshift(new PTUModifier({
                slug: "accuracy-check",
                label: "Accuracy Check",
                modifier: Infinity
            }));
        }

        // Add accuracy bonus modifier if it exists
        if (this.actor.system.modifiers.acBonus.total != 0) {
            this.modifiers.push(new PTUModifier({
                slug: "accuracy-bonus",
                label: "Accuracy Bonus",
                modifier: this.actor.system.modifiers.acBonus.total
            }));
        }

        // Epopee: Precision raises the attacker's own accuracy rolls. Kept separate from
        // acBonus above, which is PTR's modifier that abilities and effects write into -
        // folding PRE in would make the two indistinguishable in the roll breakdown.
        const precision = precisionBonus(this.actor);
        if (precision !== 0) {
            this.modifiers.push(new PTUModifier({
                slug: "precision",
                label: game.i18n.localize("PTU.Epopee.Precision"),
                modifier: precision
            }));
        }

        const critRangeModifiers = [
            new PTUModifier({
                slug: "crit-range",
                label: "Crit Range",
                modifier: this.actor.system.modifiers.critRange.total ?? 0
            }),
        ];

        critRangeModifiers.push(...extractModifiers(this.actor.synthetics, [
            "crit-range",
            `${this.item.id}-crit-range`,
            `${this.item.slug}-crit-range`,
            `${sluggify(this.item.system.category)}-crit-range`,
            `${sluggify(this.item.system.type)}-crit-range`,
            `${sluggify(this.item.system.frequency)}-crit-range`
        ], { test: this.options }));

        this.critRangeModifiers = critRangeModifiers;

        return this;
    }

    /**
     * @override
     * @returns {PTUAttackCheck}
     */
    prepareStatistic() {
        super.prepareStatistic(sluggify(game.i18n.format("PTU.Action.AttackRoll", { move: this.item.name })));

        this.critMod = Math.max(
            0,
            Object.values(
                this.critRangeModifiers.reduce((acc, mod) => {
                    if(!mod.ignored && !acc[mod.slug]) acc[mod.slug] = mod.modifier;
                    return acc;
                }, {})
            ).reduce((acc, mod) => acc + mod, 0)
        )
        return this;
    }

    /* -------------------------------------------- */
    /* Execution                                    */
    /* -------------------------------------------- */

    /**
     * @override 
     * @param {boolean} isReroll
     * @param {CheckCallback} callback
    */
    async execute(callback, isReroll = false) {
        const title = game.i18n.format("PTU.Action.AttackRoll", { move: this.item.name });
        // Epopee: accuracy is rolled on a d100.
        const diceSize = ACCURACY_DIE;

        const attack = (() => {
            if (!this.item || !this.actor) return null;

            const attack = this.actor.system.attacks.get(this.item.realId);
            if (!attack) return null;

            return {
                actor: this.actor.uuid,
                id: attack.item.realId ?? attack.item._id,
                name: attack.item.name,
                targets: (() => {
                    const targets = this.contexts;
                    if (!targets) return null;

                    return targets.map(target => ({
                        actor: target.actor?.uuid,
                        token: target.token?.uuid ?? target.token?.id
                    }));
                })(),
            }
        })();

        /** @type {DcCollection} */
        const dcs = (() => {
            const targets = new Map();
            const critRange = Array.fromRange(1 + Math.max(this.critMod, 0), 20 - Math.max(this.critMod, 0));

            /** @type {TargetContext[]} */
            const contexts = this._contexts.size > 0 ? this._contexts : [{ actor: this.actor, options: this.options, token: this.token }]

            for (const context of contexts) {
                const target = {
                    uuid: context.actor.uuid,
                    critRange,
                    // Shown as "<target>'s <slug>": one Esquive, no evasion type any more.
                    slug: "PTU.Epopee.Esquive",
                    statistic: CheckModifier.create({
                        slug: "evasion",
                        modifiers: [],
                        rollOptions: context.options,
                    }),
                    get value() {
                        return target.statistic.totalModifier;
                    }
                }

                // Epopee: "le check de difficulte = AC + Esquive de l'adversaire", where
                // Esquive is the target's base + mod + combat stages (stats/secondary.js).
                // It replaces PTR's Physical / Special / Speed Evasion, which scaled on its
                // own from the defence stats and was picked by the move's category.
                const ac = Number(this.item?.system.ac);
                if (Number.isFinite(ac)) {
                    target.statistic.push(new PTUModifier({
                        slug: "ac",
                        label: "AC",
                        modifier: ac
                    }));
                }

                // A Vulnerable target cannot dodge: only the AC remains.
                if (context.options.has("target:condition:vulnerable")) {
                    target.statistic.push(new PTUModifier({
                        slug: "vulnerable",
                        label: "Vulnerable",
                        modifier: 0
                    }));
                }
                else {
                    target.statistic.push(new PTUModifier({
                        slug: "esquive",
                        label: game.i18n.localize("PTU.Epopee.Esquive"),
                        modifier: esquiveValue(context.actor)
                    }));
                }

                for (const modifier of extractModifiers(context.actor.synthetics, ["evasion"], { test: context.options })) {
                    target.statistic.push(modifier);
                }

                if (context.options.has("target:flanked")) {
                    target.statistic.push(new PTUModifier({
                        slug: "flanked",
                        label: "Flanked",
                        modifier: -2
                    }));
                }

                targets.set(context.actor.uuid, target);
            }

            return {
                base: null,
                baseCritRange: null,
                targets
            }
        })();

        return await super.execute({
            diceSize,
            isReroll,
            attack,
            title,
            dcs,
            type: "attack-roll"
        },
            callback
        );
    }

    /** @override */
    async afterRoll() {
        if (this.conditionOptions.has("condition:confused") && !ALL_STATUS_DEFINITIONS.confused) await PTUCondition.HandleConfusion(this.item, this.actor);
        await super.afterRoll();
    }

    /** @override */
    createFlavor({ extraTags = [], inverse = false, title }) {
        const base = super.createFlavor({ extraTags, inverse, title, type: "attack-roll" });

        const typeAndCategoryHeader = (() => {
            const header = document.createElement("div");
            header.classList.add("header-bar");
            header.classList.add("type-category");

            const type = document.createElement("div");
            type.classList.add("type-img");

            const typeImg = document.createElement("img");
            typeImg.src = CONFIG.PTU.data.typeEffectiveness[this.item.system.type].images.bar;
            type.append(typeImg);

            const category = document.createElement("div");
            category.classList.add("type-img");

            const categoryImg = document.createElement("img");
            categoryImg.src = `/systems/pe/static/css/images/categories/${this.item.system.category}.png`;
            category.append(categoryImg);

            header.append(category, type);
            return header
        })();

        return [base.at(0), typeAndCategoryHeader, base.at(1)]
    }

    /**
     * Fully Executes the attack, including all checks and preparations
     * @param {StatisticModifier?} attackStatistic
     * @param {CheckCallback?} callback
     * @returns {Promise<AttackRoll>}
     */
    async executeAttack(callback = null, attackStatistic = null) {
        await this.prepareContexts(attackStatistic);
        if (!this.attackNoTargets()) return null;
        if (!this.attackOutOfRange()) return null;
        if (!this.attackDisabled()) return null;

        this.prepareModifiers();
        this.prepareStatistic();

        await this.beforeRoll();
        const roll = await this.execute(callback);
        await this.afterRoll();

        return roll;
    }

    /* -------------------------------------------- */
    /* Fail Checks                                  */
    /* -------------------------------------------- */

    /**
     * Checks whether evaluation should be halted due to the attack lacking the required range.
     * @returns {boolean}
     */
    attackOutOfRange() {
        if (!this.isSelfAttack && game.settings.get("pe", "automation.failAttackIfOutOfRange")) {
            for (const context of this.contexts) {
                if (typeof context.distance !== "number") continue;

                const range = (() => {
                    if (this.isRangedAttack) return this.item.system.range.match(/\d+/)?.[0] ?? 1;
                    return 1;
                })();

                if (context.distance > range) {
                    ui.notifications.warn("PTU.Action.AttackOutOfRange", { localize: true });
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Checks whether evaluation should be halted due to the attack lacking the required targets.
     * @returns {boolean}
     */
    attackNoTargets() {
        if (game.settings.get("pe", "automation.failAttackIfNoTarget")) {
            if (this._contexts.size === 0) {
                ui.notifications.warn("PTU.Action.NoTarget", { localize: true });
                return false;
            }
        }
        return true;
    }

    /**
     * Checks whether evaluation should be halted due to the attack being disabled through some condition
     * @returns {boolean}
     */
    attackDisabled() {
        if (this.options.has("condition:cannot-attack")) {
            ui.notifications.warn("PTU.Action.CannotAttack", { localize: true });
            return false;
        }
        if (this.conditionOptions.has("condition:frozen")) {
            ui.notifications.warn("PTU.Action.MoveWhileFrozen", { localize: true });
            return false;
        }
        if (this.conditionOptions.has("condition:sleep") && !this.options.has("self:ignore:sleep")) {
            ui.notifications.warn("PTU.Action.MoveWhileSleeping", { localize: true });
            return false;
        }
        if (this.conditionOptions.has("condition:rage") && this.selectors.includes("status-attack")) {
            ui.notifications.warn("PTU.Action.StatusAttackWhileRaging", { localize: true });
            return false;
        }
        if (this.conditionOptions.has("condition:disabled") && this.options.has(`condition:disabled:${this.item.slug}`)) {
            ui.notifications.warn("PTU.Action.DisabledMove", { localize: true });
            return false;
        }
        if (this.conditionOptions.has("condition:suppressed") && !this.selectors.includes(`at-will-attack`)) {
            ui.notifications.warn("PTU.Action.SuppressedMove", { localize: true });
            return false;
        }
        return true;
    }


}

export { PTUAttackCheck }