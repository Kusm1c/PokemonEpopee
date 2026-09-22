/**
 * Origin chooser for the Trainer sheet.
 *
 * "Choix d'Origine, via un gros bouton. Ouvre une fenetre qui fait une chaine de choix :
 *  liste des Origines, augmentations de Skills au choix, objets au choix, definition de
 *  la/les Feature de l'origine, renommage en 'Nom de l'Origine [Choix Redige]', bloc de
 *  texte concatene dans la description. AVANT LES CHOIX, donne directement X
 *  augmentations de Skills specifiques, X Pokedollars, X Objets."
 *
 * The doc does not define what the Origins *are* - there is no Origin list, no per-origin
 * grant table and no Feature roster to pick from. So this wizard drives the *chain*, and
 * reads its content from a compendium of Origin items when one exists, falling back to a
 * free-form entry so a GM can still author one by hand. Wiring a fixed list would mean
 * inventing the setting's Origins, which is yours to write.
 */

/** Where the wizard looks for authored Origins, in order. */
const ORIGIN_SOURCES = ["ptu.origins", "ptu.edges", "ptu.feats"];

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
            if (isOriginPack || keywords.includes("origin") || keywords.includes("origine")) {
                found.push(doc);
            }
        }
    }

    return found;
}

/**
 * Run the chain and write the result onto the actor.
 *
 * Grants are applied in the doc's order: the automatic part first, then the chosen part,
 * then the rename and the description block.
 *
 * @param {object} actor
 */
async function runOriginWizard(actor) {
    const origins = await collectOrigins();

    const originOptions = origins.length
        ? origins.map(o => `<option value="${o.uuid}">${o.name}</option>`).join("")
        : "";

    const skills = Object.entries(actor.system.skills ?? {})
        .map(([key, s]) => `<option value="${key}">${game.i18n.localize(`PTU.Skills.${s.slug ?? key}`)}</option>`)
        .join("");

    const content = `
        <p style="font-size:11px;opacity:.8;">
            Chaîne de choix d'Origine. Les champs vides sont simplement ignorés.
        </p>
        <div class="form-group">
            <label>Origine</label>
            ${origins.length
            ? `<select id="ptu-origin-uuid"><option value="">(saisie libre)</option>${originOptions}</select>`
            : `<p style="font-size:11px;opacity:.7;">Aucune Origine trouvée dans les compendiums — saisie libre.</p>`}
        </div>
        <div class="form-group">
            <label>Nom de l'Origine</label>
            <input type="text" id="ptu-origin-name" value="${actor.system.epopee?.origin?.name ?? ""}"/>
        </div>
        <div class="form-group">
            <label>Choix Rédigé <span style="opacity:.6;">(apparaît entre crochets)</span></label>
            <input type="text" id="ptu-origin-choice" value="${actor.system.epopee?.origin?.choice ?? ""}"/>
        </div>
        <hr/>
        <p style="font-weight:bold;">Accordé directement</p>
        <div class="form-group">
            <label>Pokédollars</label>
            <input type="number" id="ptu-origin-money" value="0"/>
        </div>
        <div class="form-group">
            <label>Compétence augmentée (auto)</label>
            <select id="ptu-origin-skill-auto"><option value="">(aucune)</option>${skills}</select>
        </div>
        <hr/>
        <p style="font-weight:bold;">Au choix</p>
        <div class="form-group">
            <label>Compétence augmentée (au choix)</label>
            <select id="ptu-origin-skill-pick"><option value="">(aucune)</option>${skills}</select>
        </div>
        <div class="form-group">
            <label>Nombre de Features de l'Origine</label>
            <input type="number" id="ptu-origin-features" value="1"/>
        </div>
        <div class="form-group">
            <label>Description concaténée</label>
            <textarea id="ptu-origin-desc" rows="3">${actor.system.epopee?.origin?.description ?? ""}</textarea>
        </div>
    `;

    const result = await Dialog.prompt({
        title: "Choix d'Origine",
        content,
        label: "Appliquer",
        options: { width: 480 },
        callback: (html) => ({
            uuid: html.find("#ptu-origin-uuid").val() ?? "",
            name: html.find("#ptu-origin-name").val()?.trim() ?? "",
            choice: html.find("#ptu-origin-choice").val()?.trim() ?? "",
            money: Number(html.find("#ptu-origin-money").val()) || 0,
            skillAuto: html.find("#ptu-origin-skill-auto").val() ?? "",
            skillPick: html.find("#ptu-origin-skill-pick").val() ?? "",
            features: Number(html.find("#ptu-origin-features").val()) || 0,
            description: html.find("#ptu-origin-desc").val() ?? ""
        })
    }).catch(() => null);

    if (!result) return null;

    // If an authored Origin was picked, its name wins unless one was typed.
    let originDoc = null;
    if (result.uuid) {
        originDoc = await fromUuid(result.uuid);
        if (originDoc && !result.name) result.name = originDoc.name;
    }

    const updates = {
        "system.epopee.origin.name": result.name,
        "system.epopee.origin.choice": result.choice,
        "system.epopee.origin.description": result.description
    };

    if (result.money) {
        updates["system.money"] = (Number(actor.system.money) || 0) + result.money;
    }

    for (const key of [result.skillAuto, result.skillPick]) {
        if (!key || !actor.system.skills?.[key]) continue;
        const path = `system.skills.${key}.value.mod`;
        updates[path] = (Number(foundry.utils.getProperty(actor, path)) || 0) + 1;
    }

    await actor.update(updates);

    // The Origin item itself is copied onto the actor so its own rules apply.
    if (originDoc) {
        await actor.createEmbeddedDocuments("Item", [originDoc.toObject()]);
    }

    const label = result.choice ? `${result.name} [${result.choice}]` : result.name;
    ui.notifications.info(
        `Origine appliquée : ${label || "(sans nom)"}`
        + (result.money ? ` — +${result.money} Pokédollars` : "")
        + (result.features ? ` — ${result.features} Feature(s) à placer` : "")
    );

    return result;
}

export { runOriginWizard, collectOrigins };
