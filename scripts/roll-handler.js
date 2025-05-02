export let RollHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
     */
    RollHandler = class RollHandler extends coreModule.api.RollHandler {
        /**
         * Handle action click
         * Called by Token Action HUD Core when an action is left or right-clicked
         * @override
         * @param {object} event        The event
         * @param {string} encodedValue The encoded value
         */
        async handleActionClick (event, encodedValue) {
            const [actionTypeId, actionId] = encodedValue.split('|');

            const renderable = ['item'];

            if (renderable.includes(actionTypeId) && this.isRenderItem()) {
                return this.doRenderItem(this.actor, actionId);
            }

            const knownCharacters = ['character']

            // If single actor is selected
            if (this.actor) {
                await this.#handleAction(event, this.actor, this.token, actionTypeId, actionId);
                return;
            }

            const controlledTokens = canvas.tokens.controlled
                .filter((token) => knownCharacters.includes(token.actor?.type));

            // If multiple actors are selected
            for (const token of controlledTokens) {
                const actor = token.actor;
                await this.#handleAction(event, actor, token, actionTypeId, actionId);
            }
        }

        /**
         * Handle action hover
         * Called by Token Action HUD Core when an action is hovered on or off
         * @override
         * @param {object} event        The event
         * @param {string} encodedValue The encoded value
         */
        async handleActionHover (event, encodedValue) {};

        /**
         * Handle group click
         * Called by Token Action HUD Core when a group is right-clicked while the HUD is locked
         * @override
         * @param {object} event The event
         * @param {object} group The group
         */
        async handleGroupClick (event, group) {};

        /**
         * Handle action
         * @private
         * @param {object} event        The event
         * @param {object} actor        The actor
         * @param {object} token        The token
         * @param {string} actionTypeId The action type id
         * @param {string} actionId     The actionId
         */
        async #handleAction (event, actor, token, actionTypeId, actionId) {
            switch (actionTypeId) {
                case "stat":
                    this.#handleStatAction(event, actor, actionId);
                    break;
                case "derived":
                    this.#handleDerivedAction(event, actor, actionId);
                    break;
                case "feature":
                    this.#handleFeatureAction(event, actor, actionId);
                    break;
                case "gear":
                    this.#handleItemAction(event, actor, actionId);
                    break
                case "weapon":
                    this.#handleWeaponAction(event, actor, actionId);
                    break
                case "ailment":
                    this.#handleAilmentAction(event, actor, actionId);
                    break
                case "utility":
                    this.#handleUtilityAction(actor, token, actionId);
                    break
            }
        }

        /**
         * Handle stat action. Right click to use full dialog.
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleStatAction (event, actor, actionId) {
            actor.rollSplitD100(actor.system.stats[actionId].tn, 
                coreModule.api.Utils.i18n(`SMT_X.Stat.${actionId}.long`), !this.isRightClick);
        }

        /**
         * Handle dervided stat action. Right click to use full dialog.
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleDerivedAction (event, actor, actionId) {
            switch(actionId) {
                case "dodge":
                    actor.rollSplitD100(actor.system.dodgetn, 
                        coreModule.api.Utils.i18n("tokenActionHud.smt.dodge"), !this.isRightClick);
                    break;
                case "talk":
                    actor.rollSplitD100(actor.system.talktn, 
                        coreModule.api.Utils.i18n("tokenActionHud.smt.talk"), !this.isRightClick);
                    break;
                case "melee":
                    actor.rollPower("(@powerDice.melee)d10x + @meleePower", "strike", !this.isRightClick);
                    break;
                case "ranged":
                    actor.rollPower("(@powerDice.ranged)d10x + @rangedPower", "gun", !this.isRightClick);
                    break;
                case "spell":
                    actor.rollPower("(@powerDice.spell)d10x + @meleePower", "almighty", !this.isRightClick);
                    break;
                case "init":
                    const combatant = game.combat?.getCombatantByActor(actor);
                    if (combatant) {
                        game.combat.rollInitiative(combatant.id);
                    } else {
                        ui.notifications.info(`${actor.name} is not in combat. Add them to combat first.`);
                    }
                    break;
            }
        }

        /**
         * Handle feature action
         */
        #handleFeatureAction (event, actor, actionId) {
            const [id, action] = actionId.split('_');
            const item = actor.items.get(id);
            switch (action) {
                case "card":
                    item.roll();
                    break;
                case "tn":
                    item.rollSplitD100(!this.isRightClick);
                    break;
                case "power":
                    item.rollPower(!this.isRightClick);
                    break;
                case "cost":
                    actor.payCost(id);
                    break;
                case "uses":
                    const value = this.isRightClick ?
                        Math.max(0, item.system.uses.value - 1) :
                        Math.min(item.system.uses.max, item.system.uses.value + 1);
                    item.update({ "system.uses.value": value });
                    return Hooks.callAll('forceUpdateTokenActionHud');
                    break;
            }
        }

        /**
         * Handle item action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleItemAction (event, actor, actionId) {
            const item = actor.items.get(actionId);
            switch (item?.type) {
                case "consumable":
                    if (!this.isRightClick) {
                        if (item.system.power || item.system.powerDice) {
                            item.rollPower(true);
                        } else {
                            item.roll();
                        }
                    } else {
                        const quantity = Math.max(0, item.system.quantity - 1);
                        item.update({ "system.quantity": quantity });
                        return Hooks.callAll('forceUpdateTokenActionHud');
                    }
                    break;
                case "armor":
                    item.update({ "system.equipped": !item.system.equipped })
                    return Hooks.callAll('forceUpdateTokenActionHud');
                    break;
            }
        }

        /**
         * Handle weapon action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleWeaponAction (event, actor, actionId) {
            const [id, action] = actionId.split('_');
            const item = actor.items.get(id);
            switch (action) {
                case "card":
                    item.roll();
                    break;
                case "slota":
                    item.update({ "system.slotA": !item.system.slotA })
                    const weaponObjA = !item.system.slotA ? {
                        "name": item.name,
                        "type": item.system.type,
                        "hit": item.system.hit,
                        "power": item.system.power,
                        "ammo": item.system.maxAmmo, // set fully loaded
                        "maxAmmo": item.system.maxAmmo
                    } : {"name": "", "type": "", "hit": "", "power": "", "ammo": "", "maxAmmo": ""};
                    actor.update({ "system.wepA": weaponObjA });
                    return Hooks.callAll('forceUpdateTokenActionHud');
                    break;
                case "slotb":
                    item.update({ "system.slotB": !item.system.slotB })
                    const weaponObjB = !item.system.slotB ? {
                        "name": item.name,
                        "type": item.system.type,
                        "hit": item.system.hit,
                        "power": item.system.power,
                        "ammo": item.system.maxAmmo, // set fully loaded
                        "maxAmmo": item.system.maxAmmo
                    } : {"name": "", "type": "", "hit": "", "power": "", "ammo": "", "maxAmmo": ""};
                    actor.update({ "system.wepB": weaponObjB });
                    return Hooks.callAll('forceUpdateTokenActionHud');
                    break;
            }
        }

        /**
         * Handle ailment action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleAilmentAction (event, actor, actionId) {
            const ailment = CONFIG.statusEffects.find(a => a.id == actionId);
            const effect = actor.effects.filter(a => a.name == ailment.name);

            if (actor.statuses.find(s => s == actionId)) {
                actor.toggleStatusEffect(actionId, { active: false });
            } else {
                actor.applyBS(actionId);
            }

            return Hooks.callAll('forceUpdateTokenActionHud');
        }

        /**
         * Handle utility action
         * @private
         * @param {object} actor    The actor
         * @param {object} token    The token
         * @param {string} actionId The action id
         */
        async #handleUtilityAction (actor, token, actionId) {}
    }
})
