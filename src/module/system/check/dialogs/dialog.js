import { PTUModifier, StatisticModifier } from "../../../actor/modifiers.js";
import { PTUDiceCheck } from "../check.js";
import { localize } from "../../../i18n.js";
import { MAX_ROLL_COUNT, clampRollCount } from "../roll-count.js";

/**
 * Epopee: the "Nombre de jets" field, for every roll but damage - advantage applies to
 * checks. Where a low result wins (the capture check), the lowest is kept.
 */
function rollCountData({ count, type, lowerIsBetter }) {
    return {
        showRollCount: type !== "damage-roll",
        rollCount: clampRollCount(count),
        maxRollCount: MAX_ROLL_COUNT,
        rollCountHint: localize(lowerIsBetter ? "PTU.Epopee.Dialog.RollCountHintLowest" : "PTU.Epopee.Dialog.RollCountHint")
    };
}

/** The number typed in the field, read when the roll button is pressed. */
function readRollCount($html, fallback) {
    const input = $html.find("input[name=rollCount]")[0];
    return input ? clampRollCount(input.value) : clampRollCount(fallback);
}

export class CheckDialog extends Application {
    /**
     * Display the dialog and await it's resolution
     * @param {PTUDiceCheck} check 
     * @param {Object} context
     * @param {String} context.title
     * @param {String} context.rollMode
     * @param {String} context.fortuneType
     * @param {StatisticModifier} context.statistic
     * @param {number} [context.rollCount] how many rolls the "Nombre de jets" field starts at
     * @returns {Promise<{fortuneType: String, rollMode: String, statistic: StatisticModifier, rollCount: number}>}
     */
    static async DisplayDialog({title, fortuneType, rollMode, statistic, type, rollModeLocked = false, rollCount = 1}) {
        return new Promise((resolve) => {
            const dialog = new CheckDialog({
                resolve,
                title,
                fortuneType,
                rollMode,
                statistic,
                type,
                rollModeLocked,
                rollCount
            });
            dialog.render(true);
        });
    }

    constructor({resolve, title, fortuneType, rollMode, statistic, type, rollModeLocked = false, rollCount = 1}) {
        super({title});

        this.resolve = resolve;
        this.fortuneType = fortuneType;
        this.rollMode = rollMode;
        // A caller that fixes the roll mode (the Navigator's secret roll) locks the select.
        this.rollModeLocked = rollModeLocked === true;
        this.check = statistic;
        this.substitutions = [];
        this.type = type;
        this.rollCount = clampRollCount(rollCount);

        this.extraClasses = (() => {
            switch(type) {
                case "attack-roll": return ["attack"];
                case "damage-roll": return ["damage"];
                case "check": return ["check"];
                case "skill": return ["skill"];
                default: return [];
            }
        })();
    }
    
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/pe/static/templates/chat/check/check-modifiers-dialog.hbs",
            classes: ["dice-checks", "dialog"],
            popOut: true,
            width: 380,
            height: "auto",
        };
    }

    /** @override */
    getData() {
        const fortune = this.fortuneType === "keep-higher";
        const misfortune = this.fortuneType === "keep-lower";
        const none = fortune === misfortune;
        const rollMode =
            this.rollMode === "roll" ? game.settings.get("core", "rollMode") : this.rollMode;

        return {
            appId: this.id,
            modifiers: this.check.modifiers,
            totalModifier: this.check.totalModifier,
            rollModes: CONFIG.Dice.rollModes,
            rollMode,
            rollModeLocked: this.rollModeLocked,
            showRollDialogs: true,
            substitutions: this.substitutions,
            fortune,
            none,
            misfortune,
            extraClasses: this.extraClasses.join(" "),
            ...rollCountData({ count: this.rollCount, type: this.type })
        };
    }

    /** @override */
    activateListeners($html) {
        const thisref = this;

        $html.find("button.roll").on("click", () => {
            thisref.rollCount = readRollCount($html, thisref.rollCount);
            thisref.resolve({
                fortuneType: thisref.fortuneType,
                rollMode: thisref.rollMode,
                statistic: thisref.check,
                rollCount: thisref.rollCount,
            });
            thisref.isResolved = true;
            thisref.close();
        });

        // Kept across the re-renders that toggling a modifier causes.
        $html.find("input[name=rollCount]").on("change", (event) => {
            this.rollCount = clampRollCount(event.currentTarget.value);
            event.currentTarget.value = this.rollCount;
        });

        for (const checkbox of $html.find(".substitutions input[type=checkbox]")) {
            checkbox.addEventListener("click", () => {
                const index = Number(checkbox.dataset.subIndex);
                const substitution = this.substitutions.at(index);
                if (!substitution) return;

                substitution.ignored = !checkbox.checked;
                const options = (this.options ??= new Set());
                const option = `substitute:${substitution.slug}`;

                if (substitution.ignored) {
                    options.delete(option);
                } else {
                    options.add(option);
                }

                this.check.calculateTotal(this.options);
                this.render();
            });
        }

        for (const checkbox of $html.find(".dialog-row input[type=checkbox]")) {
            checkbox.addEventListener("click", (event) => {
                const checkbox = event.currentTarget;
                const index = Number(checkbox.dataset.modifierIndex);
                this.check.modifiers[index].ignored = !checkbox.checked;
                this.check.calculateTotal();
                this.render();
            });
        }

        const addModifierButton = $html.find("button.add-modifier")[0];
        addModifierButton?.addEventListener("click", () => {
            const parent = addModifierButton.parentElement;
            const value = Number(parent.querySelector(".add-modifier-value")?.value || 1);
            let name = String(parent.querySelector(".add-modifier-name")?.value);
            const errors = [];
            if (Number.isNaN(value)) {
                errors.push(localize("PTU.Epopee.Notify.ModifierNaN"));
            } else if (value === 0) {
                errors.push(localize("PTU.Epopee.Notify.ModifierZero"));
            }
            if (!name || !name.trim()) {
                name = localize("PTU.Epopee.Dialog.UnnamedModifier")
            }
            if (errors.length > 0) {
                ui.notifications.error(errors.join(" "));
            } else {
                this.check.push(new PTUModifier({label: name, modifier: value}));
                this.render();
            }
        });

        for (const rollTwice of $html.find(".fate input[type=radio]")) {
            rollTwice.addEventListener("click", () => {
                this.fortuneType = (rollTwice.value || false);
            });
        }

        const rollModeInput = $html.find("select[name=rollmode]")[0];
        rollModeInput?.addEventListener("change", () => {
            if (this.rollModeLocked) return;
            const rollMode = rollModeInput.value;
            if (!Object.values(CONST.DICE_ROLL_MODES).includes(rollMode)) {
                throw Error("Unexpected roll mode");
            }
            this.rollMode = rollMode;
        });
    }

    /** @override */
    async close(options) {
        if (!this.isResolved) this.resolve(false);
        return super.close(options);
    }

    /** @override */
    _injectHTML($html) {
        super._injectHTML($html);

        $html[0]?.querySelector("button.roll")?.focus();
    }
}

export class CheckModifiersDialog extends Application {
    constructor(check, resolve, context) {
        super({ title: context?.title || check.slug })

        this.check = check;
        this.resolve = resolve;
        this.substitutions = context?.substitutions ?? [];
        this.context = context;
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/pe/static/templates/chat/check/check-modifiers-dialog.hbs",
            classes: ["dice-checks", "dialog"],
            popOut: true,
            width: 380,
            height: "auto",
        };
    }

    /** @override */
    getData() {
        const fortune = this.context.rollTwice === "keep-higher";
        const misfortune = this.context.rollTwice === "keep-lower";
        const none = fortune === misfortune;
        const rollMode =
            this.context.rollMode === "roll" ? game.settings.get("core", "rollMode") : this.context.rollMode;

        return {
            appId: this.id,
            modifiers: this.check.modifiers,
            totalModifier: this.check.totalModifier,
            rollModes: CONFIG.Dice.rollModes,
            rollMode,
            // A caller that fixes the roll mode (the Navigator's secret roll) locks the select.
            rollModeLocked: this.context.lockRollMode === true,
            showRollDialogs: true,
            substitutions: this.substitutions,
            fortune,
            none,
            misfortune,
            ...rollCountData({
                count: this.context.rollCount ?? 1,
                type: this.context.type,
                lowerIsBetter: this.context.type === "capture-calculation"
            })
        };
    }

    /** @override */
    activateListeners($html) {
        const thisref = this;

        $html.find("button.roll").on("click", () => {
            thisref.context.rollCount = readRollCount($html, thisref.context.rollCount ?? 1);
            thisref.resolve(true);
            thisref.isResolved = true;
            thisref.close();
        });

        // Kept across the re-renders that toggling a modifier causes.
        $html.find("input[name=rollCount]").on("change", (event) => {
            this.context.rollCount = clampRollCount(event.currentTarget.value);
            event.currentTarget.value = this.context.rollCount;
        });

        for (const checkbox of $html.find(".substitutions input[type=checkbox]")) {
            checkbox.addEventListener("click", () => {
                const index = Number(checkbox.dataset.subIndex);
                const substitution = this.substitutions.at(index);
                if (!substitution) return;

                substitution.ignored = !checkbox.checked;
                const options = (this.context.options ??= new Set());
                const option = `substitute:${substitution.slug}`;

                if (substitution.ignored) {
                    options.delete(option);
                } else {
                    options.add(option);
                }

                this.check.calculateTotal(this.context.options);
                this.render();
            });
        }

        for (const checkbox of $html.find(".dialog-row input[type=checkbox]")) {
            checkbox.addEventListener("click", (event) => {
                const checkbox = event.currentTarget;
                const index = Number(checkbox.dataset.modifierIndex);
                this.check.modifiers[index].ignored = !checkbox.checked;
                this.check.calculateTotal();
                this.render();
            });
        }

        const addModifierButton = $html.find("button.add-modifier")[0];
        addModifierButton?.addEventListener("click", () => {
            const parent = addModifierButton.parentElement;
            const value = Number(parent.querySelector(".add-modifier-value")?.value || 1);
            let name = String(parent.querySelector(".add-modifier-name")?.value);
            const errors = [];
            if (Number.isNaN(value)) {
                errors.push(localize("PTU.Epopee.Notify.ModifierNaN"));
            } else if (value === 0) {
                errors.push(localize("PTU.Epopee.Notify.ModifierZero"));
            }
            if (!name || !name.trim()) {
                name = localize("PTU.Epopee.Dialog.UnnamedModifier")
            }
            if (errors.length > 0) {
                ui.notifications.error(errors.join(" "));
            } else {
                this.check.push(new PTUModifier({label: name, modifier: value}));
                this.render();
            }
        });

        for (const rollTwice of $html.find(".fate input[type=radio]")) {
            rollTwice.addEventListener("click", () => {
                this.context.rollTwice = (rollTwice.value || false);
            });
        }

        const rollModeInput = $html.find("select[name=rollmode]")[0];
        rollModeInput?.addEventListener("change", () => {
            if (this.context.lockRollMode) return;
            const rollMode = rollModeInput.value;
            if (!Object.values(CONST.DICE_ROLL_MODES).includes(rollMode)) {
                throw Error("Unexpected roll mode");
            }
            this.context.rollMode = rollMode;
        });
    }

    /** @override */
    async close(options) {
        if (!this.isResolved) this.resolve(false);
        return super.close(options);
    }

    /** @override */
    _injectHTML($html) {
        super._injectHTML($html);

        $html[0]?.querySelector("button.roll")?.focus();
    }
}