import { localize } from "../../module/i18n.js";
export function changeRotomForm() {
    const actor = canvas.tokens.controlled[0]?.actor;
    if (!actor?.species?.slug.startsWith("rotom")) return ui.notifications.error(localize("PTU.Epopee.Notify.Rotom.Select"));

    const change = async (forme) => {
        const notifId = ui.notifications.info(localize("PTU.Epopee.Notify.Rotom.Updating"))
        const [species, move] = await (async () => {
            switch (forme) {
                case "normal": return [await game.pe.item.get("rotom-normal", "species"), null]
                case "fan": return [await game.pe.item.get("rotom-fan", "species"), await game.pe.item.get("air-slash", "move")]
                case "frost": return [await game.pe.item.get("rotom-frost", "species"), await game.pe.item.get("blizzard", "move")]
                case "heat": return [await game.pe.item.get("rotom-heat", "species"), await game.pe.item.get("overheat", "move")]
                case "mow": return [await game.pe.item.get("rotom-mow", "species"), await game.pe.item.get("leaf-storm", "move")]
                case "wash": return [await game.pe.item.get("rotom-wash", "species"), await game.pe.item.get("hydro-pump", "move")]
            }
        })();
        if (!species) return ui.notifications.error(localize("PTU.Epopee.Notify.Rotom.NoSpecies"));
        if (actor.species.slug === species.slug) return ui.notifications.warn(localize("PTU.Epopee.Notify.Rotom.NoChange"));
        const image = species.getImagePath({ shiny: !!actor.system.shiny });

        const newSize = (() => {
            const size = species.system.size.sizeClass;
            switch (size) {
                case "Tiny": return { width: 0.5, height: 0.5 };
                case "Small": return { width: 1, height: 1 };
                case "Medium": return { width: 1, height: 1 };
                case "Large": return { width: 2, height: 2 };
                case "Huge": return { width: 3, height: 3 };
                case "Gigantic": return { width: 4, height: 4 };
                default: return { width: 1, height: 1 };
            }
        })();

        const toCreate = [species.toObject()];

        if (actor.species.slug == "rotom-normal") {
            toCreate.push(move.toObject());
        }
        if (actor.species.slug != "rotom-normal") {
            const moveSlug = (() => {
                switch (actor.species.system.form) {
                    case "fan": return "air-slash";
                    case "frost": return "blizzard";
                    case "heat": return "overheat";
                    case "mow": return "leaf-storm";
                    case "wash": return "hydro-pump";
                }
            })();
            const item = actor.itemTypes.move.find(m => m.slug == moveSlug);
            if (item) await actor.deleteEmbeddedDocuments("Item", [item.id]);
            if (move) toCreate.push(move.toObject());
        }

        await actor.createEmbeddedDocuments("Item", toCreate);
        await actor.update({
            img: image,
            "prototypeToken.texture.src": image,
            "prototypeToken.width": newSize.width,
            "prototypeToken.height": newSize.height
        });
        for (const token of actor.getActiveTokens()) {
            await token.document.update({
                "texture.src": image,
                "width": newSize.width,
                "height": newSize.height
            });
        }
        ui.notifications.remove(notifId);
    }

    const d = new Dialog({
        title: localize("PTU.Epopee.Notify.Rotom.Title"),
        content: localize("PTU.Epopee.Notify.Rotom.Question"),
        buttons: {
            normal: { label: localize("PTU.Epopee.Notify.Rotom.Form.normal"), callback: () => change("normal") },
            fan: { label: localize("PTU.Epopee.Notify.Rotom.Form.fan"), callback: () => change("fan") },
            frost: { label: localize("PTU.Epopee.Notify.Rotom.Form.frost"), callback: () => change("frost") },
            heat: { label: localize("PTU.Epopee.Notify.Rotom.Form.heat"), callback: () => change("heat") },
            mow: { label: localize("PTU.Epopee.Notify.Rotom.Form.mow"), callback: () => change("mow") },
            wash: { label: localize("PTU.Epopee.Notify.Rotom.Form.wash"), callback: () => change("wash") }
        }
    })
    d.render(true);
}