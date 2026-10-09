import { sluggify } from '../../../util/misc.js';
import { PTUCondition, PTUItem } from '../index.js';
import { ALL_STATUS_DEFINITIONS } from '../../statuses/definitions.js';
import { extractApplyEffects } from '../../rules/helpers.js';
import { canUse, spendUse } from '../../usage/engine.js';

/** Accuracy outcomes that count as the move landing. */
const HIT_OUTCOMES = ["hit", "crit-hit"];

class PTUMove extends PTUItem {
    get rollable() {
        return !(isNaN(Number(this.system.ac ?? undefined)) && isNaN(Number(this.system.damageBase ?? undefined)));
    }

    get usable() {
        return !this.rollable && this.system.frequency !== "Static";
    }

    /** @override */
    get rollOptions() {
        const options = super.rollOptions;
        if(this.isDamaging && this.damageBase.isStab) {
            options.all['move:is-stab'] = true;
            options.item['move:is-stab'] = true;
        }
        if (this.isDamaging && this.damageBase.isStab && !!options.all[`move:damage-base:${this.damageBase.preStab}`]) {
            delete this.flags.pe.rollOptions.all[`move:damage-base:${this.damageBase.preStab}`];
            delete this.flags.pe.rollOptions.item[`move:damage-base:${this.damageBase.preStab}`];

            this.flags.pe.rollOptions.all[`move:damage-base:${this.damageBase.postStab}`] = true;
            this.flags.pe.rollOptions.item[`move:damage-base:${this.damageBase.postStab}`] = true;

            options.all[`move:damage-base:${this.damageBase.postStab}`] = true;
            options.item[`move:damage-base:${this.damageBase.postStab}`] = true;
        }
        for(const keyword of this.system.keywords) {
            options.all[`move:${sluggify(keyword)}`] = true;
            options.item[`move:${sluggify(keyword)}`] = true;
        }
        return options;
    }

    /** @override */
    get realId() {
        return this.system.isStruggle
            ? `struggle-${this.system.type.toLocaleLowerCase(game.i18n.lang)}-${this.system.category.toLocaleLowerCase(game.i18n.lang)}${this.system.isRangedStruggle ? "-ranged" : ""}`
            : super.realId;
    }

    get isDamaging() {
        return !isNaN(Number(this.system.damageBase ?? undefined));
    }

    get isFiveStrike() {
        return (!!this.rollOptions.item["move:range:five-strike"]) || (!!this.rollOptions.item["move:five-strike"]);
    }

    get damageBase() {
        if (!this.isDamaging) return null;
        const result = {
            preStab: isNaN(Number(this.system.damageBase)) ? 0 : Number(this.system.damageBase),
            postStab: 0,
            isStab: false,
        }
        result.postStab = result.preStab + (!this.system.isStruggle && this.actor?.types.includes(this.system.type) ? 2 : 0);
        result.isStab = result.preStab !== result.postStab;
        return result;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        const rollOptions = {
            all: {
                [`move:type:${sluggify(this.system.type)}`]: true,
                [`move:category:${sluggify(this.system.category)}`]: true,
                [`move:frequency:${sluggify(this.system.frequency)}`]: true,
            },
        }

        const ranges = this.system.range?.split(",").map(r => r.trim()) ?? [];
        for (const range of ranges) {
            rollOptions.all[`move:range:${sluggify(range)}`] = true;
        }

        if (this.isDamaging) {
            rollOptions.all[`move:damage-base:${this.damageBase.postStab}`] = true;
            rollOptions.all[`move:damage-base:pre-stab:${this.damageBase.preStab}`] = true;
        }
        if (!isNaN(Number(this.system.ac))) rollOptions.all[`move:ac:${this.system.ac}`] = true;
        rollOptions.item = rollOptions.all;

        this.flags.pe = foundry.utils.mergeObject(this.flags.pe, {rollOptions});
        this.flags.pe.rollOptions.attack = Object.keys(this.flags.pe.rollOptions.all).reduce((obj, key) => {
            obj[key.replace("move:", "attack:").replace("item:", "attack:")] = true;
            return obj;
        }, {});
    }

    /**
     * Apply a status move's effects.
     *
     * @param {object} [options]
     * @param {{actor: object, outcome?: string}[]} [options.targets] From an attack message,
     *        each with its accuracy outcome. Without them, the user's current targets.
     * @param {number|null} [options.rollResult] The accuracy d20, for "on 18+" effects
     * @override
     */
    async use(options = {}) {
        if (this.isDamaging || this.system.frequency === "Static") return;

        // Epopee: a move rolled for accuracy already spent its use on the roll
        // (PTUActor#prepareAttack). One with no roll - Rock Polish, Protect - is used
        // straight from its chat card, so it spends here.
        if (!this.rollable) {
            if (!canUse(this)) return;
            if (this.isOwner) await spendUse(this);
        }

        // Only the targets the accuracy roll hit. Targets picked by hand carry no outcome
        // and are taken as hit, since nothing was rolled against them.
        const targets = (options.targets ?? [...game.user.targets])
            .filter(t => !t?.outcome || HIT_OUTCOMES.includes(t.outcome));

        let didSomething = false;
        const conditions = new Set(this.actor.getFilteredRollOptions("condition"))
        if (conditions.has("condition:confused") && !ALL_STATUS_DEFINITIONS.confused) {
            await PTUCondition.HandleConfusion(this, this.actor);
            didSomething = true;
        }

        const results = [];

        // ApplyEffect rules. PTR only runs them when damage is applied, which a status move
        // never does, so Dragon Dance or Nasty Plot carried rules that could not fire. Run
        // them here, against the accuracy roll, the same way the damage path does.
        const reference = this.referenceEffect ? await fromUuid(this.referenceEffect) : null;
        results.push(...await this._applyRuleEffects(targets, options.rollResult ?? null, reference));

        if (reference) {
            const effect = reference;
            const recipients = this.range.includes("Self") ? [this.actor] : targets;
            const result = await effect.apply(recipients, this.actor);
            if (result) results.push(...result);
        }

        if (results.length > 0) {
            const statements = results.map((effect) =>
                game.i18n.format("PTU.Broadcast.ApplyEffect", { actor: effect.actor.link, effect: effect.link, source: this.actor.link })
            ).filter(s => s).join("<br/>")
            const enrichedHtml = await foundry.applications.ux.TextEditor.implementation.enrichHTML(statements, { async: true })
            const chatData = {
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: await foundry.applications.handlebars.renderTemplate("systems/pe/static/templates/chat/effect-applied.hbs", { statements: enrichedHtml }),
                style: CONST.CHAT_MESSAGE_STYLES.OTHER,
                whisper: this.actor.hasPlayerOwner ? [game.user.id] : game.users.filter(u => u.isGM).map(u => u.id),
            };
            await ChatMessage.create(chatData);
            didSomething = true;
        }

        if (!didSomething) {
            ui.notifications.warn(game.i18n.localize("PTU.Notifications.NoEffect"));
        }
    }

    /**
     * Run this move's ApplyEffect rules for a status move: target effects on each target
     * hit, origin effects on the user. Mirrors the damage path (message/damage.js), with
     * the same domains, so a rule written for one works for the other.
     *
     * @param {{actor: object}[]} targets already filtered to the ones hit
     * @param {number|null} accuracy the accuracy d20, or null for a move with no roll
     * @param {object|null} [reference] the move's referenceEffect, applied separately; a
     *        rule granting the same effect is skipped so it does not land twice
     * @returns {Promise<object[]>} the created effect items
     */
    async _applyRuleEffects(targets, accuracy, reference = null) {
        const skip = new Set(reference ? [reference.system?.slug || reference.name] : []);
        if (!this.actor) return [];
        // The rule checks `roll + Effect Range >= threshold`. A move that rolls nothing has
        // no threshold to meet - its effect simply happens - so it passes as Infinity
        // rather than failing as 0.
        const roll = Number.isFinite(Number(accuracy)) && accuracy !== null ? Number(accuracy) : Infinity;
        const options = this.actor.getRollOptions(["all", "attack"]);
        const domainsFor = (suffix) => [
            `${this.id}-damage-${suffix}`,
            `${this.slug}-damage-${suffix}`,
            `${this.system.category.toLocaleLowerCase(game.i18n.lang)}-damage-${suffix}`,
            `${this.system.type.toLocaleLowerCase(game.i18n.lang)}-damage-${suffix}`,
            `${sluggify(this.system.frequency)}-damage-${suffix}`
        ];
        // One copy per effect: two rules granting the same effect apply it once, as on
        // the damage path.
        const keyOf = (e) => e.system?.slug || e.name;
        const unique = (effects) => Object.values(effects.reduce((acc, e) => {
            if (!skip.has(keyOf(e))) acc[keyOf(e)] ??= e;
            return acc;
        }, {}));

        const created = [];
        for (const target of targets) {
            const actor = target?.actor ?? target;
            if (!(actor instanceof CONFIG.PTU.Actor.documentClass)) continue;
            const effects = unique(await extractApplyEffects({
                affects: "target", origin: this.actor, target: actor, item: this,
                domains: ["damage-received", ...domainsFor("received")], options, roll
            }));
            if (effects.length) created.push(...await actor.createEmbeddedDocuments("Item", effects));
        }

        const own = unique(await extractApplyEffects({
            affects: "origin", origin: this.actor, target: this.actor, item: this,
            domains: ["damage-dealt", ...domainsFor("dealt")], options, roll
        }));
        if (own.length) created.push(...await this.actor.createEmbeddedDocuments("Item", own));

        return created;
    }
}

export { PTUMove }