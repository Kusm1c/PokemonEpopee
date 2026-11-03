/**
 * Origin chooser for the Trainer sheet.
 *
 * "Choix d'Origine, via un gros bouton. Ouvre une fenetre qui fait une chaine de choix :
 *  liste des Origines, augmentations de Skills au choix, objets au choix, definition de
 *  la/les Feature de l'origine, renommage en 'Nom de l'Origine [Choix Redige]', bloc de
 *  texte concatene dans la description. AVANT LES CHOIX, donne directement X
 *  augmentations de Skills specifiques, X Pokedollars, X Objets."
 *
 * Origins now come from three places, in this order: the ones written in
 * `module/origins/data.js`, any authored in a compendium, and free-form entry for a GM
 * improvising one at the table. Picking a written Origin fills the chain from its data -
 * money, Trait with its specialty list, numbered starting items - so the player only
 * answers the questions the sheet actually asks.
 */

import { getOrigins, getOrigin, resolveItemGrant } from "../../origins/data.js";
import { findItemInCompendium } from "../../../util/misc.js";
import { hasKeyword } from "../../keywords/index.js";
import { localize } from "../../i18n.js";

/** Where the wizard looks for authored Origins, in order. */
const ORIGIN_SOURCES = ["pe.origins", "pe.edges", "pe.feats"];

/**
 * Pull every Origin-flavoured item the world can offer.
 * An item counts as an Origin when it lives in a pack named `origins`, or carries the
 * `origin` keyword - so a GM can author them in whichever pack they prefer.
 */
async function collectOrigins() {
    const found = [];

    for (const packId of ORIGIN_SOURCES) {
        const pack = game.packs.get(packId);
        if (!pack) continue;

        const isOriginPack = packId.endsWith(".origins");
        const docs = await pack.getDocuments();
        for (const doc of docs) {
            const keywords = (doc.system?.keywords ?? []).map(k => String(k).toLowerCase());
            if (isOriginPack || hasKeyword(keywords, "origin")) {
                found.push(doc);
            }
        }
    }

    return found;
}

/** Minimal escaping for text going into an attribute or a text node. */
function escapeHtml(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** `<option>` list built from plain strings. */
function optionList(values, selected) {
    return values.map(v => `<option value="${escapeHtml(v)}"${v === selected ? " selected" : ""}>${escapeHtml(v)}</option>`).join("");
}

/**
 * The part of the dialog that depends on which Origin is selected.
 *
 * Rebuilt on every change of the Origin dropdown rather than toggling visibility: the
 * rows differ in number and in kind from one Origin to the next, so there is no fixed set
 * of fields to show and hide.
 *
 * @param {object|null} origin     a written Origin, or null for the free-form path
 * @param {string} skillOptions    `<option>` list of the actor's skills
 */
function renderDetail(origin, skillOptions) {
    if (!origin) {
        return `
            <div class="form-group">
                <label>${localize("PTU.Epopee.Apps.Origin.Name")}</label>
                <input type="text" name="origin-name" value=""/>
            </div>
            <div class="form-group">
                <label>${localize("PTU.Epopee.Apps.Origin.Choice")} <span style="opacity:.6;">${localize("PTU.Epopee.Apps.Origin.ChoiceHint")}</span></label>
                <input type="text" name="origin-choice" value=""/>
            </div>
            <div class="form-group">
                <label>${localize("PTU.Epopee.Apps.Origin.Money")}</label>
                <input type="number" name="origin-money" value="0"/>
            </div>
            <div class="form-group">
                <label>${localize("PTU.Epopee.Apps.Origin.SkillAuto")}</label>
                <select name="origin-skill-auto"><option value="">${localize("PTU.Epopee.Setup.NoneF")}</option>${skillOptions}</select>
            </div>
            <div class="form-group">
                <label>${localize("PTU.Epopee.Apps.Origin.SkillPick")}</label>
                <select name="origin-skill-pick"><option value="">${localize("PTU.Epopee.Setup.NoneF")}</option>${skillOptions}</select>
            </div>
            <div class="form-group">
                <label>${localize("PTU.Epopee.Apps.Origin.FeatureCount")}</label>
                <input type="number" name="origin-features" value="1"/>
            </div>
            <div class="form-group">
                <label>${localize("PTU.Epopee.Apps.Origin.Description")}</label>
                <textarea name="origin-desc" rows="3"></textarea>
            </div>`;
    }

    const trait = origin.trait;
    // A Trait may ask for several picks ("Choisis deux traits de personnalité"): one list
    // per pick, the ones past `minPicks` optional ("jusqu'à deux").
    const traitPick = (index) => {
        const optional = index >= trait.minPicks ? `<option value="">${localize("PTU.Epopee.Setup.NoneM")}</option>` : "";
        const custom = trait.allowCustom ? `<option value="__custom__">${localize("PTU.Epopee.Apps.Origin.Custom")}</option>` : "";
        return `
        <div class="form-group">
            <label>${escapeHtml(trait.choiceLabel)}${trait.picks > 1 ? ` ${index + 1}` : ""}</label>
            <select name="origin-trait-${index}" data-trait-pick="${index}">${optional}${optionList(trait.choices, index < trait.minPicks ? trait.choices[index] : undefined)}${custom}</select>
        </div>
        <div class="form-group" data-custom-trait="${index}" style="display:none;">
            <label>${localize("PTU.Epopee.Apps.Origin.CustomChoice")}</label>
            <input type="text" name="origin-trait-custom-${index}" value=""/>
        </div>`;
    };
    const traitPicks = trait ? Array.from({ length: trait.picks }, (_, i) => traitPick(i)).join("") : "";

    const itemRows = origin.items.map((entry, index) => {
        const field = (() => {
            if (entry.options) {
                // "3 baies au choix": one list per item picked.
                const picks = Math.max(1, Number(entry.picks) || 1);
                const list = optionList(entry.options.map(o => o.label));
                return Array.from({ length: picks }, (_, p) =>
                    `<select name="origin-item-${index}-${p}">${list}</select>`).join("");
            }
            if (entry.prompt) {
                return `<input type="text" name="origin-item-${index}" placeholder="${escapeHtml(entry.prompt)}"/>`;
            }
            return `<span style="flex:1;opacity:.7;">${localize("PTU.Epopee.Apps.Origin.Granted")}</span>`;
        })();

        return `
            <div class="form-group">
                <label style="flex:2;">${escapeHtml(entry.label)}</label>
                ${field}
            </div>`;
    }).join("");

    const promptList = (title, items) => items.length ? `
        <p style="margin:6px 0 2px;font-weight:bold;">${escapeHtml(title)}</p>
        <ul style="margin:0 0 6px 16px;padding:0;">
            ${items.map(p => `<li>${escapeHtml(p)}</li>`).join("")}
        </ul>` : "";

    const pokemon = origin.startingPokemon;
    const pokemonBlock = (pokemon.text || pokemon.examples.length) ? `
        <p style="margin:6px 0 2px;font-weight:bold;">${localize("PTU.Epopee.Apps.Origin.StartingPokemon")}</p>
        ${pokemon.text ? `<p style="margin:0 0 4px;">${escapeHtml(pokemon.text)}</p>` : ""}
        ${pokemon.examples.length ? `<ul style="margin:0 0 6px 16px;padding:0;">
            ${pokemon.examples.map(e => `<li>${escapeHtml(e)}</li>`).join("")}
        </ul>` : ""}` : "";

    const narrative = [
        pokemonBlock,
        promptList(localize("PTU.Personality"), origin.personalityPrompts),
        promptList(localize("PTU.Epopee.Apps.Origin.Relationships"), origin.relationshipPrompts)
    ].join("");

    // Every section is optional. An Origin part-way through being written - a name, some
    // money, a Trait - has to open without throwing, so each block is skipped when empty
    // rather than rendering an empty heading.
    return `
        ${origin.intro.length ? `
        <div style="font-size:11px;opacity:.85;border-left:2px solid #888;padding-left:8px;margin-bottom:8px;">
            ${origin.intro.map(p => `<p style="margin:0 0 6px;">${escapeHtml(p)}</p>`).join("")}
        </div>` : ""}

        <p style="font-weight:bold;margin:0;">${localize("PTU.Epopee.Apps.Origin.GrantedNow")}</p>
        <p style="font-size:11px;margin:2px 0 8px;">
            ${localize("PTU.Epopee.Apps.Origin.StartingMoney", { money: origin.money.toLocaleString(game.i18n.lang) })}
        </p>

        ${trait ? `
        <p style="font-weight:bold;margin:0;">${localize("PTU.Epopee.Apps.Origin.Trait", { name: escapeHtml(trait.name) })}</p>
        <div style="font-size:11px;opacity:.85;margin:2px 0 6px;">
            ${trait.description.map(p => `<p style="margin:0 0 4px;">${escapeHtml(p)}</p>`).join("")}
        </div>
        ${trait.choices.length || trait.allowCustom ? traitPicks : ""}` : ""}

        ${origin.items.length ? `
        <hr/>
        <p style="font-weight:bold;margin:0 0 4px;">${localize("PTU.Epopee.Apps.Origin.StartingItems")}</p>
        ${itemRows}` : ""}

        ${narrative ? `
        <hr/>
        <details>
            <summary style="cursor:pointer;font-weight:bold;">${localize("PTU.Epopee.Apps.Origin.Narrative")}</summary>
            <div style="font-size:11px;opacity:.9;padding-top:4px;">${narrative}</div>
        </details>` : ""}`;
}

/**
 * Turn the answers into the text block the sheet shows under the Origin button.
 *
 * Plain text, not HTML: the sheet renders this escaped, so tags would show up as tags.
 */
function buildDescription(origin, traitChoice, itemLabels) {
    const lines = [...origin.intro];

    if (origin.trait) {
        const named = traitChoice ? `${origin.trait.name} [${traitChoice}]` : origin.trait.name;
        lines.push("", localize("PTU.Epopee.Apps.Origin.Trait", { name: named }), ...origin.trait.description);
    }

    if (itemLabels.length) {
        lines.push("", localize("PTU.Epopee.Apps.Origin.StartingItemsList"), ...itemLabels.map(l => `• ${l}`));
    }

    return lines.join("\n");
}

/**
 * Create the Trait and the starting items on the actor.
 *
 * A granted item is copied from `pe.items` when a counterpart exists there, so its own
 * rules and artwork come along; the compendium's name is kept in that case, since PTR
 * rules key off it. Rows with no counterpart - a research bag, a notebook - become plain
 * items under their French name, so the player still has them on the sheet.
 */
async function applyGrants(actor, origin, traitChoice, grants) {
    const sources = [];

    if (origin.trait) {
        sources.push({
            name: traitChoice ? `${origin.trait.name} [${traitChoice}]` : origin.trait.name,
            type: "feat",
            system: {
                effect: origin.trait.description.map(p => `<p>${p}</p>`).join(""),
                frequency: "Static",
                free: true,
                keywords: ["origine"],
                source: { value: localize("PTU.Epopee.Apps.Origin.Source", { name: origin.name }) }
            },
            flags: { pe: { originGrant: origin.slug } }
        });
    }

    for (const grant of grants) {
        if (!grant) continue;

        let source = null;
        if (grant.lookup) {
            try {
                const found = await findItemInCompendium({ type: "item", name: grant.lookup });
                if (found) {
                    source = found.toObject();
                    delete source._id;
                }
            } catch (error) {
                // A missing or unreadable pack must not cost the player the rest of their
                // kit - fall through to the plain item below.
                console.warn(`PokemonEpopee | Origin item lookup failed for "${grant.lookup}":`, error);
            }
        }
        source ??= { name: grant.label, type: "item", system: {} };

        source.system = { ...source.system, quantity: grant.quantity ?? 1 };
        source.flags = {
            ...(source.flags ?? {}),
            pe: { ...(source.flags?.pe ?? {}), originGrant: origin.slug }
        };
        sources.push(source);
    }

    if (sources.length) await actor.createEmbeddedDocuments("Item", sources);
    return sources.length;
}

/**
 * Run the chain and write the result onto the actor.
 *
 * @param {object} actor
 */
async function runOriginWizard(actor) {
    const written = getOrigins();
    const authored = await collectOrigins();

    // Re-running must not hand out the money and the items a second time. The text fields
    // stay editable - only the one-off grants are gated.
    const current = actor.system.epopee?.origin ?? {};
    const alreadyGranted = !!current.granted;

    const skillOptions = Object.entries(actor.system.skills ?? {})
        .map(([key, s]) => `<option value="${key}">${game.i18n.localize(`PTU.Skills.${s.slug ?? key}`)}</option>`)
        .join("");

    const writtenOptions = written.map(o => `<option value="${o.slug}">${escapeHtml(o.name)}</option>`).join("");
    const authoredOptions = authored.map(o => `<option value="uuid:${o.uuid}">${escapeHtml(o.name)}</option>`).join("");

    const content = `
        <p style="font-size:11px;opacity:.8;">${localize("PTU.Epopee.Apps.Origin.Intro")}</p>
        ${alreadyGranted ? `
        <p style="font-size:11px;border:1px solid #a55;padding:4px;border-radius:3px;">
            ${localize("PTU.Epopee.Apps.Origin.AlreadyApplied", { name: escapeHtml(current.name || localize("PTU.Epopee.Apps.Origin.Unnamed")) })}
        </p>` : ""}
        <div class="form-group">
            <label>${localize("PTU.Epopee.Apps.Origin.Label")}</label>
            <select name="origin-key">
                ${writtenOptions}
                ${authoredOptions ? `<optgroup label="${localize("PTU.Epopee.Apps.Origin.Compendiums")}">${authoredOptions}</optgroup>` : ""}
                <option value="">${localize("PTU.Epopee.Apps.Origin.FreeForm")}</option>
            </select>
        </div>
        <hr/>
        <div data-origin-detail>${renderDetail(written[0] ?? null, skillOptions)}</div>
    `;

    const read = (html, name) => html.find(`[name="${name}"]`).val();

    const result = await Dialog.prompt({
        title: localize("PTU.Epopee.Apps.Origin.Title"),
        content,
        label: localize("PTU.Epopee.Setup.Apply"),
        options: { width: 520 },
        render: (html) => {
            const detail = html.find("[data-origin-detail]");

            const syncCustomTrait = () => {
                html.find("[data-trait-pick]").each((_, select) => {
                    const isCustom = select.value === "__custom__";
                    html.find(`[data-custom-trait="${select.dataset.traitPick}"]`).css("display", isCustom ? "" : "none");
                });
            };

            // Delegated, so it survives the panel being replaced below.
            detail.on("change", "[data-trait-pick]", syncCustomTrait);

            html.find('[name="origin-key"]').on("change", (event) => {
                const key = event.currentTarget.value;
                const origin = key && !key.startsWith("uuid:") ? getOrigin(key) : null;
                detail.html(renderDetail(origin ?? null, skillOptions));
                syncCustomTrait();
            });

            syncCustomTrait();
        },
        callback: (html) => {
            const key = read(html, "origin-key") ?? "";
            const origin = key && !key.startsWith("uuid:") ? getOrigin(key) : null;

            if (!origin) {
                return {
                    uuid: key.startsWith("uuid:") ? key.slice(5) : "",
                    name: read(html, "origin-name")?.trim() ?? "",
                    choice: read(html, "origin-choice")?.trim() ?? "",
                    money: Number(read(html, "origin-money")) || 0,
                    skillAuto: read(html, "origin-skill-auto") ?? "",
                    skillPick: read(html, "origin-skill-pick") ?? "",
                    features: Number(read(html, "origin-features")) || 0,
                    description: read(html, "origin-desc") ?? ""
                };
            }

            // Every pick, custom text resolved, blanks and repeats dropped: "Affectueux, Stoïque".
            const traitPicks = Array.from({ length: origin.trait?.picks ?? 0 }, (_, i) => {
                const raw = read(html, `origin-trait-${i}`) ?? "";
                return raw === "__custom__" ? (read(html, `origin-trait-custom-${i}`)?.trim() ?? "") : raw;
            }).filter(Boolean);
            const traitChoice = [...new Set(traitPicks)].join(", ");

            return {
                origin,
                traitChoice,
                selections: origin.items.map((entry, index) => {
                    if (!entry.options) return read(html, `origin-item-${index}`) ?? "";
                    const picks = Math.max(1, Number(entry.picks) || 1);
                    return Array.from({ length: picks }, (_, p) => read(html, `origin-item-${index}-${p}`) ?? "");
                })
            };
        }
    }).catch(() => null);

    if (!result) return null;

    return result.origin
        ? applyWrittenOrigin(actor, result, alreadyGranted)
        : applyFreeFormOrigin(actor, result, alreadyGranted);
}

/**
 * The written path: everything comes from the Origin's own data.
 *
 * @returns {Promise<object>}
 */
async function applyWrittenOrigin(actor, result, alreadyGranted) {
    const { origin, traitChoice, selections } = result;

    // A row picked several times grants each pick; the same item picked twice is one stack.
    const rowGrants = origin.items.map((entry, index) => {
        const picks = Array.isArray(selections[index]) ? selections[index] : [selections[index]];
        const merged = new Map();
        for (const grant of picks.map(pick => resolveItemGrant(entry, pick)).filter(Boolean)) {
            const key = `${grant.label}|${grant.lookup ?? ""}`;
            const existing = merged.get(key);
            if (existing) existing.quantity += grant.quantity ?? 1;
            else merged.set(key, { ...grant, quantity: grant.quantity ?? 1 });
        }
        return [...merged.values()];
    });
    const grants = rowGrants.flat();
    const itemLabels = origin.items.map((entry, index) => {
        const granted = rowGrants[index];
        if (!granted.length) return entry.label;
        return granted.map(g => (g.quantity > 1 ? `${g.quantity} × ${g.label}` : g.label)).join(", ");
    });

    const updates = {
        "system.epopee.origin.slug": origin.slug,
        "system.epopee.origin.name": origin.name,
        "system.epopee.origin.choice": traitChoice,
        "system.epopee.origin.description": buildDescription(origin, traitChoice, itemLabels)
    };

    if (!alreadyGranted) {
        updates["system.money"] = (Number(actor.system.money) || 0) + origin.money;
        updates["system.epopee.origin.granted"] = true;
    }

    await actor.update(updates);

    const granted = alreadyGranted ? 0 : await applyGrants(actor, origin, traitChoice, grants);

    const label = traitChoice ? `${origin.name} [${traitChoice}]` : origin.name;
    ui.notifications.info(
        localize("PTU.Epopee.Apps.Origin.Applied", { name: label })
        + (alreadyGranted
            ? localize("PTU.Epopee.Apps.Origin.AppliedAlready")
            : localize("PTU.Epopee.Apps.Origin.AppliedGrants", { money: origin.money.toLocaleString(game.i18n.lang), n: granted }))
    );

    return result;
}

/**
 * The improvised path: nothing is written down, so the GM types what they want and the
 * wizard only records it.
 *
 * @returns {Promise<object>}
 */
async function applyFreeFormOrigin(actor, result, alreadyGranted) {
    let originDoc = null;
    if (result.uuid) {
        originDoc = await fromUuid(result.uuid);
        if (originDoc && !result.name) result.name = originDoc.name;
    }

    const updates = {
        "system.epopee.origin.slug": "",
        "system.epopee.origin.name": result.name,
        "system.epopee.origin.choice": result.choice,
        "system.epopee.origin.description": result.description
    };

    if (result.money) {
        updates["system.money"] = (Number(actor.system.money) || 0) + result.money;
        updates["system.epopee.origin.granted"] = true;
    }

    for (const key of [result.skillAuto, result.skillPick]) {
        if (!key || !actor.system.skills?.[key]) continue;
        const path = `system.skills.${key}.value.mod`;
        updates[path] = (Number(foundry.utils.getProperty(actor, path)) || 0) + 1;
    }

    await actor.update(updates);

    // The Origin item itself is copied onto the actor so its own rules apply.
    if (originDoc) await actor.createEmbeddedDocuments("Item", [originDoc.toObject()]);

    const label = result.choice ? `${result.name} [${result.choice}]` : result.name;
    ui.notifications.info(
        localize("PTU.Epopee.Apps.Origin.Applied", { name: label || `(${localize("PTU.Epopee.Apps.Origin.Unnamed")})` })
        + (result.money ? localize("PTU.Epopee.Apps.Origin.AppliedMoney", { money: result.money.toLocaleString(game.i18n.lang) }) : "")
        + (result.features ? localize("PTU.Epopee.Apps.Origin.AppliedFeatures", { n: result.features }) : "")
        + (alreadyGranted && result.money ? localize("PTU.Epopee.Apps.Origin.AppliedWasGranted") : "")
    );

    return result;
}

export { runOriginWizard, collectOrigins };
