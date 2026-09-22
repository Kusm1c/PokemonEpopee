import { PTUPredicate } from "../system/index.js";

class IWRData {
    constructor({type, value, source, predicate = [], isDefensive = false}) {
        this.type = type?.toLocaleLowerCase(game.i18n.locale);
        this.value = value;
        this.source = source ?? null;
        this.isDefensive = isDefensive;
        this.predicate = new PTUPredicate([...this.describe(this.type), ...predicate])
    }

    get label() {
        return this.typeLabel;
    }

    get typeLabel() {
        const label = game.i18n.localize(`PTU.Type.${this.type}`);
        return label.startsWith("PTU.Type.") ? Handlebars.helpers.capitalize(this.type) : label;
    }

    describe(iwrType) {
        switch(iwrType) {
            case "critical-hit": return ["damage:component:critical"];
            case "effect-damage": return ["damage:component:effect"];
            default: return ["damage:type:"+this.type];
        }
    }

    toObject() {
        return {
            type: this.type,
            source: this.source,
            label: this.label,
            value: this.value
        }
    }

    test(statements) {
        // Test for ignoring defensive abilities
        if(this.isDefensive) {
            if(statements.some(s => s == "origin:ignores:defensive" )) return false;
        }

        return this.predicate.test(statements);
    }
}

class ImmunityData extends IWRData {
    constructor({type, source}) {
        super({type, value: 0, source})
    }

    /** @overwrite */
    describe(iwrType) {
        return [...super.describe(iwrType), {"not": `self:immunity-blocked:${iwrType}`}];
    }
}

class WeaknessData extends IWRData {

}

class ResistanceData extends IWRData {

}

/**
 * Scale a raw type-chart multiplier into the value actually applied to damage.
 *
 * Pokemon Epopee applies the raw product: x0.25 double resistance, x0.5 resistance,
 * x1 neutral, x2 weakness, x4 double weakness.
 *
 * Stock PTR compressed the upper half of that ladder (2 -> 1.5, 4 -> log2(4) = 2,
 * 8 -> log2(8) = 3). This is intentionally a single seam rather than four copies of
 * that ternary, so the ladder has one place to change - notably if a cap above x4
 * is ever wanted.
 *
 * @param {number} value Raw multiplier from the type chart
 * @returns {number}
 */
function scaleTypeEffectiveness(value) {
    return value;
}

export { IWRData, ImmunityData, WeaknessData, ResistanceData, scaleTypeEffectiveness }

globalThis.IWR = {
    ImmunityData,
    WeaknessData,
    ResistanceData
}