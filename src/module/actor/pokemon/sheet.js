import { LOYALTY_PROTECTION, LOYALTY_REACTION, MAX_MOVES_PER_KIND } from "./config.js";
import { PERIODS, itemUsage, resetUses } from "../../usage/engine.js";
import { prepareEpopeeSheetData } from "../epopee-sheet.js";
import { PTUPartySheet } from "../../apps/party/sheet.js";
import { clampStages } from "../../combat-math/formula.js";
import { Statistic } from "../../system/statistic/index.js";
import { PTUActorSheet } from "../sheet.js";
import { ItemSummaryRenderer } from "../sheet/item-summary.js";

export class PTUPokemonSheet extends PTUActorSheet {
	/** @override */
	static get defaultOptions() {
		const options = foundry.utils.mergeObject(super.defaultOptions, {
			classes: ['pe', 'sheet', 'actor', 'gen8'],
			template: 'systems/pe/static/templates/actor/pokemon-sheet.hbs',
			width: 1200,
			height: 640,
			tabs: [{
				navSelector: '.tabs',
				contentSelector: '.sheet-body',
				initial: 'stats'
			}],
			submitOnClose: true,
			submitOnChange: true,
			scrollY: [".sheet-body"]
		});

		// If compact style is enabled
		if (true) {
			options.classes.push('compact');
			options.template = 'systems/pe/static/templates/actor/pokemon-sheet-compact.hbs';
			options.width = 900;
			options.height = 650;
		}

		return options;
	}

	get ballStyle() {
		if (this.actor.flags.pe.theme) return this.actor.flags.pe.theme;
		if (this.actor.system.pokeball) {
			const ball = this.actor.system.pokeball.toLowerCase().replace('ball', '').trim();
			if (ball == "basic" || ball == "poke") return "default";
			return ball;
		}
		return "default";
	}

	/** @override */
	async getData() {
		const data = await super.getData();
		data.dtypes = ['String', 'Number', 'Boolean'];

		// Prepare items.
		if (this.actor.type == 'pokemon') {
			await this._prepareCharacterItems(data);
		}

		data['natures'] = CONFIG.PTU.data.natureData;

		data["ballStyle"] = this.ballStyle;

		const IWR = this.actor.iwr;
		data.effectiveness = {
			weaknesses: [],
			resistances: [],
			immunities: []
		}
		for(const [type, value] of Object.entries(IWR.all)) {
			if(value === 0) {
				data.effectiveness.immunities.push({type: type.capitalize(), value: IWR.getRealValue(type)});
				continue;
			}
			if(value > 1) {
				data.effectiveness.weaknesses.push({type: type.capitalize(), value: IWR.getRealValue(type)});
				continue;
			}
			if(value < 1) {
				data.effectiveness.resistances.push({type: type.capitalize(), value: IWR.getRealValue(type)});
				continue;
			}
		}

		data.epopee = this._prepareEpopeeData();

		return data;
	}

	/**
	 * Derived values the Epopee sheet displays: the Fragments, the STAB stat, and the
	 * per-stat MdS gauge state.
	 *
	 * Fragments are pure display - the maths lives in combat-math/formula.js and is
	 * reused here so the sheet can never disagree with the damage roll.
	 */
	_prepareEpopeeData() {
		return {
			...prepareEpopeeSheetData(this.actor, { includeFlavours: true }),
			trainingDifficulty: this.actor.system.trainingDifficulty ?? 50,
			moves: this._prepareMoveSplit(),
			heldItems: this._prepareHeldItemSplit(),
			loyaltyChecked: this.actor.system.loyalty?.checked ?? 0,
			reactionUnlocked: (this.actor.system.loyalty?.checked ?? 0) >= LOYALTY_REACTION,
			protectionUnlocked: (this.actor.system.loyalty?.checked ?? 0) >= LOYALTY_PROTECTION
		};
	}

	/**
	 * Split moves into Naturelles (level-up / egg) and Techniques (TM / move tutor),
	 * capped at 4 each. Going over is allowed but flagged - the doc asks for a
	 * notification, not a hard block, so a Pokemon mid-reorganisation isn't broken.
	 */
	_prepareMoveSplit() {
		const moves = this.actor.itemTypes?.move ?? [];
		const bucket = (kind) => {
			const list = moves
				.filter(m => !m.system.isStruggle && (m.system.acquisition ?? "natural") === kind)
				.map(m => ({ move: m, usage: itemUsage(m) }));
			return { list, count: list.length, over: list.length > MAX_MOVES_PER_KIND };
		};

		const natural = bucket("natural");
		const technical = bucket("technical");

		return {
			natural,
			technical,
			max: MAX_MOVES_PER_KIND,
			anyOver: natural.over || technical.over
		};
	}

	/**
	 * "En fin de scene, un objet Trouve va dans l'inventaire du dresseur du Pokemon
	 * s'il en a un."
	 *
	 * Moves the item rather than copying it, and clears the slot on arrival so it
	 * doesn't stay flagged as a Pokemon's found item in the trainer's bag. Does nothing
	 * when the Pokemon has no trainer, which is why the return value is reported.
	 *
	 * @returns {Promise<string[]>} names of the items handed over
	 */
	async _handOverFoundItems() {
		const trainer = this.actor.trainer;
		if (!trainer) return [];

		const found = this.actor.itemTypes.item.filter(i => (i.system.heldSlot ?? "") === "found");
		if (!found.length) return [];

		const payload = found.map(i => {
			const data = i.toObject();
			data.system.heldSlot = "";
			return data;
		});

		await trainer.createEmbeddedDocuments("Item", payload);
		await this.actor.deleteEmbeddedDocuments("Item", found.map(i => i.id));

		return found.map(i => i.name);
	}

	/**
	 * Split held items into Objet Tenu and Objet Trouvé, 1 of each. Anything not
	 * assigned to a slot is simply carried and confers nothing.
	 */
	_prepareHeldItemSplit() {
		const items = this.actor.itemTypes?.item ?? [];
		const inSlot = (slot) => items.filter(i => (i.system.heldSlot ?? "") === slot);

		const held = inSlot("held");
		const found = inSlot("found");

		return {
			held,
			found,
			carried: inSlot(""),
			heldOver: held.length > 1,
			foundOver: found.length > 1
		};
	}


	/** @override */
	_getHeaderButtons() {
		let buttons = super._getHeaderButtons();

		if (this.actor.isOwner) {
			buttons.unshift({
				label: "Rest",
				class: "rest-until-next-day",
				icon: "fas fa-bed",
				onclick: async () => {
					const max = this.actor.system.health.max ?? 0;
					const current = this.actor.system.health.value ?? 0;
					const heal = Math.ceil(max / 20) * 4;
					await this.actor.update({ "system.health.value": Math.min(max, current + heal) });

					// "Reinitialise les usages maximums par jour." Cascades into Scene and
					// EOT pools as well - see resetUses().
					const refilled = await resetUses(this.actor, PERIODS.DAILY);
					ui.notifications.info(refilled.length
						? `${this.actor.name}: healed ${heal} HP, refilled ${refilled.length} daily/scene use(s).`
						: `${this.actor.name}: healed ${heal} HP. Nothing to refill.`);
				}
			});
			buttons.unshift({
				label: "End of Scene",
				class: "end-of-scene",
				icon: "fas fa-hourglass-end",
				onclick: async () => {
					const refilled = await resetUses(this.actor, PERIODS.SCENE);
					const moved = await this._handOverFoundItems();

					const parts = [];
					if (refilled.length) parts.push(`refilled ${refilled.length} scene use(s)`);
					if (moved.length) parts.push(`handed ${moved.join(", ")} to the trainer`);
					ui.notifications.info(parts.length
						? `${this.actor.name}: ${parts.join("; ")}.`
						: `${this.actor.name}: nothing to do at end of scene.`);
				}
			});
			buttons.unshift({
				label: "Training",
				class: "training-screen",
				icon: "fas fa-dumbbell",
				onclick: () => new CONFIG.PTU.ui.pokemonTraining.sheetClass({ actor: this.actor }).render(true)
			});
			buttons.unshift({
				label: "Party",
				class: "part-screen",
				icon: "fas fa-users",
				onclick: () => new PTUPartySheet({ actor: this.actor }).render(true)
			});
		}

		return buttons;
	}

	/**
	 * Organize and classify Items for Character sheets.
	 *
	 * @param {Object} actorData The actor to prepare.
	 *
	 * @return {undefined}
	 */
	async _prepareCharacterItems(sheetData) {
		sheetData['skills'] = this.actor.system.skills

		// Initialize containers.
		const abilities = [];
		const capabilities = [];
		const items = [];
		const edges = [];
		const effects = [];
		const conditions = this.actor.conditions;
		const contestmoves = [];
		const spiritactions = [];

		// Iterate through items, allocating to containers
		// let totalWeight = 0;
		for (let i of this.actor.items.contents.sort((a, b) => (a.sort || 0) - (b.sort || 0))) {
			i.img = i.img || DEFAULT_TOKEN;

			switch (i.type) {
				case 'ability':
					abilities.push(i);
					break;
				case 'capability':
					capabilities.push(i);
					break;
				case 'pokeedge':
					edges.push(i);
					break;
				case 'effect':
					effects.push(i);
					break;
				case 'contestmove':
					contestmoves.push(i);
					break;
				case 'spiritaction':
					spiritactions.push(i);
					break;
				case 'item':
					items.push(i);
					break;
			}
		}

		// Assign and return
		sheetData.abilities = abilities;
		sheetData.capabilities = capabilities;
		sheetData.edges = edges;
		sheetData.effects = effects;
		sheetData.conditions = conditions;
		sheetData.contestmoves = contestmoves;
		sheetData.spiritactions = spiritactions;
		sheetData.items = items;

		sheetData.actions = await (async () => {
			const moves = [];
			const struggles = [];
			const effects = {};

			for (const statistic of this.actor.attacks) {
				if (statistic.item.system.isStruggle) struggles.push(statistic.item);
				else moves.push(statistic.item);

				const effect = statistic.item.system.effect + (statistic.item.effectReference ? "<br/></br>" + statistic.item.effectReference : "");
				//effects[statistic.item.id] = await TextEditor.enrichHTML(effect, {async: true});
			}

			const sorted = moves.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

			// Epopee: "Split entre Capacites Naturelles (par LvL ou Oeuf) et Capacites
			// Techniques (par CT ou move tutor) -- 4 max chacun (notif quand y'en a trop)".
			// Over the cap is allowed but flagged, so reorganising a moveset isn't blocked.
			const byKind = (kind) => sorted.filter(m => (m.system.acquisition ?? "natural") === kind);
			const natural = byKind("natural");
			const technical = byKind("technical");

			return {
				moves: sorted,
				natural,
				technical,
				naturalOver: natural.length > MAX_MOVES_PER_KIND,
				technicalOver: technical.length > MAX_MOVES_PER_KIND,
				maxPerKind: MAX_MOVES_PER_KIND,
				struggles,
				effects
			}
		})();

		return sheetData;
	}

	/** @override */
	activateListeners(html) {
		super.activateListeners(html);

		this._itemSummaryRenderer = new ItemSummaryRenderer(this);
		this._itemSummaryRenderer.activateListeners(html);

		html.find('.loyalty-cell').click((ev) => {
			const index = Number(ev.currentTarget.dataset.index);
			const { checked, unlocked } = this.actor.system.loyalty;
			if (index >= unlocked) return;
			const newChecked = (index + 1 === checked) ? index : index + 1;
			this.actor.update({ "system.loyalty.checked": newChecked });
		});

		// MdS gauges: clicking cell N sets the stage to N, clicking the current value
		// clears it back to 0, so one control both sets and unsets.
		html.find('.mds-cell').click((ev) => {
			const { stat, index } = ev.currentTarget.dataset;
			const target = Number(index);
			const current = clampStages(
				(this.actor.system.stats[stat]?.stage?.value ?? 0) + (this.actor.system.stats[stat]?.stage?.mod ?? 0)
			);
			this.actor.update({ [`system.stats.${stat}.stage.value`]: current === target ? 0 : target });
		});

		// "Lors d'un Entrainement, chaque joueur lance 1d100, dont le but est de depasser
		// la Difficulte d'Entrainement." One roll per active player, resolved together.
		html.find('.contest-mode-toggle').click(async () => {
			const current = this.actor.getFlag("pe", "contestMode") === true;
			await this.actor.setFlag("pe", "contestMode", !current);
		});

		html.find('.training-roll').click(async () => {
			const difficulty = this.actor.system.trainingDifficulty ?? 50;
			const players = game.users.filter(u => u.active && !u.isGM);
			const rollers = players.length ? players : [game.user];

			const rows = [];
			let anySuccess = false;

			for (const user of rollers) {
				const roll = await new Roll("1d100").evaluate();
				const success = roll.total >= difficulty;
				if (success) anySuccess = true;
				rows.push(`<tr><td>${user.name}</td><td style="text-align:center;">${roll.total}</td>`
					+ `<td style="text-align:center;">${success ? "<b>Réussite</b>" : "Échec"}</td></tr>`);
			}

			await ChatMessage.create({
				speaker: ChatMessage.getSpeaker({ actor: this.actor }),
				flavor: `<div class="header-bar"><p class="action">Entraînement : ${this.actor.name}</p></div>`,
				content: `<p>Difficulté d'Entraînement <b>${difficulty}</b></p>`
					+ `<table style="width:100%;"><tr><th>Joueur</th><th>1d100</th><th></th></tr>${rows.join("")}</table>`
					+ `<p>${anySuccess ? "<b>Entraînement réussi.</b>" : "Aucun joueur n'a dépassé la difficulté."}</p>`
					+ `<p style="font-size:11px;opacity:.7;">Les modificateurs wildcard (Traits, Objets) sont à appliquer à la main.</p>`
			});
		});

		html.find('.moment-create').click(() => {
			const moments = [...this.actor.system.narrative.momentsOfBrilliance, ""];
			const unlocked = Math.min(20, this.actor.system.loyalty.unlocked + 1);
			this.actor.update({ "system.narrative.momentsOfBrilliance": moments, "system.loyalty.unlocked": unlocked });
		});

		html.find('.moment-delete').click((ev) => {
			const index = Number(ev.currentTarget.dataset.index);
			const moments = this.actor.system.narrative.momentsOfBrilliance.filter((_, i) => i !== index);
			this.actor.update({ "system.narrative.momentsOfBrilliance": moments });
		});

		html.find('.moment-text').change((ev) => {
			const index = Number(ev.currentTarget.dataset.index);
			const moments = [...this.actor.system.narrative.momentsOfBrilliance];
			moments[index] = ev.currentTarget.value;
			this.actor.update({ "system.narrative.momentsOfBrilliance": moments });
		});

		$(html).find('nav .tooltip').tooltipster({
			theme: `tooltipster-shadow ball-themes ${this.ballStyle}`,
			position: 'right'
		});

		$(html).find('.tag.tooltip').tooltipster({
			theme: `tooltipster-shadow ball-themes ${this.ballStyle}`,
			position: 'top'
		});

		$(html).find('input[name="system.boss.bars"]').tooltipster({
			theme: `tooltipster-shadow ball-themes ${this.ballStyle}`,
			position: 'bottom',
			content: game.i18n.localize("PTU.BossBarTooltip")
		});

		$(html).find('.species.linked-item').each(async (i, element) => {
			await CONFIG.PTU.util.Enricher.enrichContentLinks(element);
		});

		for (const element of $(html).find(".mod-input")) {
			const $html = $(element)
			const $children = $html.find('.mod-tooltip');
			if ($children.length > 0) {
				$html.tooltipster({
					theme: `tooltipster-shadow ball-themes ${this.ballStyle}`,
					position: $children.data('position') || 'bottom',
					content: `<div class="mod-tooltip">${$children.html()}</div>`,
					contentAsHTML: true,
					interactive: true,
					functionReady: async (_instance, helper) => {
						const html = $(helper.tooltip).find('.linked-item');
						if (html.length > 0) {
							for (const element of html)
								await CONFIG.PTU.util.Enricher.enrichContentLinks(element);
						}
					}
				});
			}
		}

		// Everything below here is only needed if the sheet is editable
		if (!this.options.editable) return;

		html.find('.rollable.skill').click(this._onSkillRoll.bind(this));
		html.find('.rollable.move').click(async (event) => {
			const attackId = $(event.currentTarget).closest("li.item").data("item-id");
			const attack = this.actor.attacks.get(attackId);
			if (!attack) return;

			await attack.roll?.({
				event, callback: async (rolls, targets, msg, event) => {
					if (!game.settings.get("pe", "autoRollDamage")) return;

					const params = {
						event,
						options: msg.context.options ?? [],
						actor: msg.actor,
						targets: msg.targets,
						rollResult: msg.context.rollResult ?? null,
					}
					const result = await attack.damage?.(params);
					if (result === null) {
						return await msg.update({ "flags.pe.resolved": false })
					}
				}
			});
		});
		html.find('.rollable.save').click(this._onSaveRoll.bind(this));

		// Add Inventory Item
		html.find('.item-create').click(this._onItemCreate.bind(this));

		html.find('.item-enable').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			/** @type {PTUItem} */
			const item = this.actor.items.get(li.data('itemId'));
			return item?.toggleEnableState?.();
		});

		html.find('.item-to-chat').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			const item = this.actor.items.get(li.data('itemId'));
			return item?.sendToChat?.();
		});

		// Update Inventory Item
		html.find('.item-edit').click((ev) => {
			const li = $(ev.currentTarget).parents('.item');
			const item = this.actor.items.get(li.data('itemId'));
			item.sheet.render(true);
		});

		html.find(".item-quantity input[type='number']").change((ev) => {
			const value = Number(ev.currentTarget.value);
			const id = ev.currentTarget.dataset.itemId;
			if (value >= 0 && id) {
				const item = this.actor.items.get(id);
				item?.update({ "system.quantity": value });
			}
		});

		html.find('.item-delete').click(this._onItemDelete.bind(this));

		this._contextMenu(html);
	}

	_contextMenu(html) {
		// Convert jQuery object to HTMLElement for v13 compatibility
		const htmlElement = html instanceof jQuery ? html[0] : html;
		
		foundry.applications.ux.ContextMenu.implementation.create(this, htmlElement, ".move-item", [
			{
				name: "Roll",
				icon: '<i class="fas fa-dice"></i>',
				callback: this.#onMoveRoll.bind(this),
			},
			{
				name: "Send to Chat",
				icon: '<i class="fas fa-comment"></i>',
				callback: (ev) => {
					const li = ev.closest('.item');
					const itemId = li.dataset.itemId;
					const item = this.actor.items.get(itemId);
					return item?.sendToChat?.();
				}
			},
			{
				name: "Edit",
				icon: '<i class="fas fa-edit"></i>',
				callback: (ev) => {
					const li = ev.closest('.item');
					const itemId = li.dataset.itemId;
					const item = this.actor.items.get(itemId);
					item.sheet.render(true);
				}
			},
			{
				name: "Delete",
				icon: '<i class="fas fa-trash"></i>',
				callback: this._onItemDelete.bind(this),
			},
		], { jQuery: false })
	}

	/**
	 * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onItemCreate(event) {
		event.preventDefault();
		const header = event.currentTarget;
		// Get the type of item to create.
		const type = header.dataset.type;
		// Grab any data associated with this control.
		const data = foundry.utils.duplicate(header.dataset);
		// Initialize a default name.
		const name = `New ${game.i18n.localize(`TYPES.Item.${type}`)}`;
		// Prepare the item object.
		const itemData = {
			name: name,
			type: type,
			system: data
		};
		// Remove the type from the dataset since it's in the itemData.type prop.
		delete itemData.system['type'];

		if (itemData.type === "ActiveEffect") {
			throw new Error("ActiveEffects are not supported in PTU");
		}

		// Finally, create the item!
		console.debug("Created new item", itemData);
		return this.actor.createEmbeddedDocuments("Item", [itemData]);
	}

	/**
	 * Handle deleting an Owned Item for the actor.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	_onItemDelete(event) {
		const li = $(event.currentTarget).parents('.item');
		const itemId = li.data('itemId');
		const item = this.actor.items.get(itemId);
		if (!item) throw new Error(`Item ${itemId} not found`);

		const deleteItem = async () => {
			await item.delete();
			li.slideUp(200, () => this.render(false));
		}
		if (event?.shiftKey) {
			return deleteItem();
		}


		const granter = this.actor.items.get(item.flags.pe?.grantedBy?.id ?? "");
		if (granter) {
			const parentGrant = Object.values(granter?.flags.pe?.itemGrants ?? {}).find((g) => g.id === item.id);

			if (parentGrant?.onDelete === "restrict") {
				return Dialog.prompt({
					title: game.i18n.localize("DIALOG.DeleteItem.Title"),
					content: game.i18n.format("DIALOG.DeleteItem.Restricted", { name: item.name, parentName: granter.name }),
				})
			}
		}


		new Dialog({
			title: game.i18n.localize("DIALOG.DeleteItem.Title"),
			content: game.i18n.format("DIALOG.DeleteItem.Content", { name: item.name }),
			buttons: {
				yes: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize("DIALOG.DeleteItem.Yes"),
					callback: deleteItem
				},
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: game.i18n.localize("DIALOG.DeleteItem.Cancel"),
				}
			},
			default: 'yes'
		}).render(true);
	}

	/**
	 * Handle clickable rolls.
	 * @param {Event} event   The originating click event
	 * @private
	 */
	async _onSkillRoll(event) {
		event.preventDefault();
		const skill = event.currentTarget.dataset.skill;
		await this.actor.attributes.skills[skill].roll();
	}

	async _onSaveRoll(event) {
		event.preventDefault();
		if (event.screenX == 0 && event.screenY == 0) return;

		const statistic = new Statistic(this.actor, {
			slug: "save-check",
			label: game.i18n.format("PTU.SaveCheck", { name: this.actor.name, save: "" }),
			check: { type: "save-check", domains: ["save-check"], modifiers: [] },
			//dc: { modifiers: [], domains: ["save-dc"] },
			domains: []
		});
		return await statistic.roll({ skipDialog: false })
	}

	#onMoveRoll(event) {
		event.preventDefault();

		const li = $(event.currentTarget).parents('.item');
		const itemId = li.data('itemId');
		const item = this.actor.items.get(itemId);
		if (!item) throw new Error(`Item ${itemId} not found`);
		if (item.type !== "move") throw new Error(`Item ${itemId} is not a move`);

		return this._onMoveRoll(item, { event });
	}

	async _onMoveRoll(move, { event } = {}) {
		if (!move) return;
		if (move.type !== "move") throw new Error(`Item ${itemId} is not a move`);

		if (event?.ctrlKey) {
			return move?.sendToChat?.();
		}

		const bonus = [];
		if (event?.shiftKey) {
			const extra = await new Promise((resolve, reject) => {
				Dialog.confirm({
					title: `Accuracy Modifier`,
					content: `<input type="text" name="accuracy-modifier" value="0"></input>`,
					yes: async (html) => {
						const bonusTxt = html.find('input[name="accuracy-modifier"]').val()

						const bonus = !isNaN(Number(bonusTxt)) ? Number(bonusTxt) : parseInt((await (new Roll(bonusTxt)).roll()).total);
						if (!isNaN(bonus)) {
							return resolve(bonus);
						}
						return reject();
					}
				});
			});
			if (extra) {
				bonus.push({
					value: extra,
					label: `with ${extra} accuracy modifier`
				})
			}
		}

		if (event?.altKey) {
			//TODO: Implement using AP for pokemon; currently there is no link between trainer & pokemon
		}

		return move.execute({ bonus });
	}
}