async function processGrantDeletions(item, pendingItems) {
    const { actor } = item;

    const granter = actor.items.get(item.flags.pe?.grantedBy?.id ?? "");
    const parentGrant = Object.values(granter?.flags.pe?.itemGrants ?? {}).find((g) => g.id === item.id);
    const grants = Object.values(item.flags.pe?.itemGrants ?? {});

    // Handle deletion restrictions, aborting early if found in either this item's granter or any of its grants
    if (granter && parentGrant?.onDelete === "restrict" && !pendingItems.includes(granter)) {
        ui.notifications.warn(`Item ${item.name} cannot be deleted because it is granted to ${granter.name}`)
        pendingItems.splice(pendingItems.indexOf(item), 1);
        return;
    }

    for (const grant of grants) {
        const grantee = actor.items.get(grant.id);
        if (grantee?.flags.pe.grantedBy?.id !== item.id) continue;

        if (grantee.flags.pe.grantedBy.onDelete === "restrict" && !pendingItems.includes(grantee)) {
            ui.notifications.warn(`Item ${grantee.name} cannot be deleted because it is granted to ${item.name}`)
            pendingItems.splice(pendingItems.indexOf(item), 1);
            return;
        }
    }

    // Handle deletion cascades, pushing additional items onto the `pendingItems` array
    if (granter && parentGrant?.onDelete === "cascade" && !pendingItems.includes(granter)) {
        pendingItems.push(granter);
        await processGrantDeletions(granter, pendingItems);
    }

    for (const grant of grants) {
        const grantee = actor.items.get(grant.id);
        if (grantee?.flags.pe.grantedBy?.id !== item.id) continue;

        if (grantee.flags.pe.grantedBy.onDelete === "cascade" && !pendingItems.includes(grantee)) {
            pendingItems.push(grantee);
            await processGrantDeletions(grantee, pendingItems);
        }
    }

    // Finally, handle detachments, removing the grant data from granters `itemGrants` object
    const [key] = Object.entries(granter?.flags.pe.itemGrants ?? {}).find(([, g]) => g === parentGrant) ?? [null];
    if (granter && key) {
        await granter.update({ [`flags.pe.itemGrants.-=${key}`]: null }, { render: false });
    }

    for (const grant of grants) {
        const grantee = actor.items.get(grant.id);
        if (grantee?.flags.pe.grantedBy?.id !== item.id || pendingItems.includes(grantee)) {
            continue;
        }

        // Unset the grant flag and leave the granted item on the actor
        if (grantee.flags.pe.grantedBy.onDelete === "detach") {
            await grantee.update({ "flags.pe.-=grantedBy": null }, { render: false });
        }
    }
}

export { processGrantDeletions };