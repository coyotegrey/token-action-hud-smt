// System Module Imports
import { ACTION_TYPE, ITEM_TYPE } from "./constants.js";
import { Utils } from "./utils.js";

export let ActionHandler = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
    /**
     * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
     */
    ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
        /**
         * Build system actions
         * Called by Token Action HUD Core
         * @override
         * @param {array} groupIds
         */
        #actorTypes = ["character", "npc"];
        #equippableTypes = ["weapon", "armor"];
        #featureTypes = ["feature", "passive"];
        #gearTypes = ["weapon", "armor", "consumable"];
        #derivedActions = new Map(Object.entries({
            "dodge": {"name": coreModule.api.Utils.i18n("tokenActionHud.smt.dodge")},
            "talk": {"name": coreModule.api.Utils.i18n("tokenActionHud.smt.talk")},
            "melee": {"name": coreModule.api.Utils.i18n("tokenActionHud.smt.physical")},
            "ranged": {"name": coreModule.api.Utils.i18n("tokenActionHud.smt.ranged")},
            "spell": {"name": coreModule.api.Utils.i18n("tokenActionHud.smt.spell")},
            "init": {"name": coreModule.api.Utils.i18n("tokenActionHud.smt.init")}
        }));
        #derivedStats = {
            "dodge": "dodgetn",
            "talk": "talktn",
            "melee": "meleePower",
            "ranged": "rangedPower",
            "spell": "spellPower",
            "init": "init"
        };

        async buildSystemActions (groupIds) {
            // Set actor and token variables
            this.actors = (!this.actor) ? this._getActors() : [this.actor];
            this.actorType = this.actor?.type;

            // Settings
            this.sortAlpha = Utils.getSetting("sortAlpha");
            let sortFunc = this.sortAlpha ? coreModule.api.Utils.sortItemsByName : Utils.sortItems;
            this.showTCheaders = game.settings.get("smt-200x", "showTCheaders");

            // Set items variable
            if (this.actor) {
                let gear = this.actor.items.filter(i => this.#gearTypes.includes(i.type));

                this.items = sortFunc(this.actor.items);
                this.stats = this.actor.system.stats;
                this.features = sortFunc(this.actor.items);
                this.gear = sortFunc(gear);
            }

            if (["character","npc"].includes(this.actorType)) {
                this.#buildCharacterActions();
            } else if (!this.actor) {
                this.#buildMultipleTokenActions();
            }
        }

        /**
         * Build character actions
         * @private
         */
        async #buildCharacterActions () {
            await this.#buildStats();
            await this.#buildFeatures();
            await this.#buildInventory();
            await this.#buildAilments();
            await this.#buildUtility();
        }

        /**
         * Build multiple token actions
         * @private
         * @returns {object}
         */
        #buildMultipleTokenActions () {}

        /**
         * Build stats
         * @private
         */
        async #buildStats () {
            if (this.stats.size === 0) return;

            const statData = this.stats;
            const actionTypeId = "stat";
            const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
            const groupData = { id: "stats", type: "system" };
            const actions = [];

            for (const itemId in statData) {
                const id = itemId;
                const itemData = statData[itemId];
                const label = `SMT_X.Stat.${id}.long`;
                const name = `${coreModule.api.Utils.i18n(label)}`;
                const info1 = { text: `${itemData.tn}%` };
                const listName = `${actionTypeName ? `${actionTypeName}: ` : ""}${name}`;
                const encodedValue = [actionTypeId, id].join(this.delimiter);

                actions.push({
                    id,
                    name,
                    info1,
                    listName,
                    encodedValue
                });
            }

            this.addActions(actions, groupData);

            const groupData2 = { id: 'derived', type: 'system' };
            const actions2 = this.#getItemActions(this.#derivedActions, 'derived');
            this.addActions(actions2, groupData2);
        }
        
        /**
         * Build features
         * @private
         */
        async #buildFeatures () {
            if (this.features.size === 0) return;

            const inventoryMap = new Map();

            for (const [itemId, itemData] of this.features) {
                if (!this.#featureTypes.includes(itemData.type)) continue;

                const type = itemData.type;
                const typeMap = inventoryMap.get(type) ?? new Map();
                typeMap.set(itemId, itemData);
                inventoryMap.set(type, typeMap);
            }

            for (const [type, typeMap] of inventoryMap) {
                const actionTypeId = "feature";
                const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
                const groupId = type == "feature" ? "features" : 
                    "passives";
                const parentGroupData = {
                    id: groupId,
                    type: "system"
                };

                for (const [id, itemData] of typeMap) {
                    const feature = this.features.get(id);
                    const img = coreModule.api.Utils.getImage(itemData.img);
                    const childGroupData = {
                        id: `feature_${id}`,
                        name: itemData.name,
                        type: "system",
                        settings: { showTitle: false, image: img }
                    };
                    this.addGroup(childGroupData, parentGroupData);

                    const actions = [
                        {type: "card", name: itemData.name},
                        {type: "tn", name: feature.system.displayTN},
                        {type: "power", name: feature.system.calcPower},
                        {type: "cost", name: feature.system.cost},
                        {type: "uses", name: feature.system.uses?.max ? `${feature.system.uses?.value}/${feature.system.uses?.max}` : ""}
                    ].filter(a => a.name && a.name != "-").map(a => {
                        const name = a.name;
                        const listName = `${actionTypeName ? `${actionTypeName}_${a.type}: ` : ""}${name}`;
                        const encodedValue = [actionTypeId, `${id}_${a.type}`].join(this.delimiter);
                        return {
                            id: `${id}_${a.type}`,
                            name,
                            listName,
                            encodedValue
                        };
                    });

                    this.addActions(actions, childGroupData);
                }
            }
        }

        /* *
         * Build inventory
         * @private
         */
        async #buildInventory () {
            if (this.items.size === 0) return;

            const inventoryMap = new Map();

            for (const [itemId, itemData] of this.items) {
                const type = itemData.type;
                const equipped = itemData.equipped;

                if (!this.#gearTypes.includes(type)) continue;
                if (itemData.type == "consumable" && !itemData.system.quantity) continue;

                const typeMap = inventoryMap.get(type) ?? new Map();
                typeMap.set(itemId, itemData);
                inventoryMap.set(type, typeMap);
            }

            for (const [type, typeMap] of inventoryMap) {
                const actionTypeId = type == "weapon" ? "weapon" : "gear";
                const groupId = ITEM_TYPE[type]?.groupId;

                if (!groupId) continue;

                if (type == "weapon") {
                    const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
                    const parentGroupData = { id: groupId, type: "system" };

                    for (const [id, itemData] of typeMap) {
                        const img = coreModule.api.Utils.getImage(itemData.img);
                        const childGroupData = {
                            id: `weapon_${id}`,
                            name: itemData.name,
                            type: "system",
                            settings: { showTitle: false, image: img }
                        };
                        this.addGroup(childGroupData, parentGroupData);

                        const actions = [
                            {type: "card", name: itemData.name},
                            {type: "slota", name: "A"},
                            {type: "slotb", name: "B"}
                        ].filter(a => a.name).map(a => {
                            const name = a.name;
                            const listName = `${actionTypeName ? `${actionTypeName}_${a.type}: ` : ""}${name}`;
                            const encodedValue = [actionTypeId, `${id}_${a.type}`].join(this.delimiter);
                            const active = a.type == "slota" && itemData.system.slotA ? " active" :
                                a.type == "slotb" && itemData.system.slotB ? " active" : "";
                            const cssClass = a.type == "card" ? "" : `toggle${active}`; 
                            return {
                                id: `${id}_${a.type}`,
                                name,
                                listName,
                                encodedValue,
                                cssClass
                            };
                        });
    
                        this.addActions(actions, childGroupData);
                    }
                } else {
                    const groupData = { id: groupId, type: "system" };
                    const actions = this.#getItemActions(typeMap, actionTypeId);

                    this.addActions(actions, groupData);
                }
            }
        }

        /**
         * Build ailments
         * @private
         */
        async #buildAilments () {
            const ailments = CONFIG.statusEffects.filter((ailment) => ailment.id !== "");
            if (ailments.length === 0) return;

            const actionTypeId = "ailment";
            const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
            const groupData = { id: "ailments", type: "system" };
            const actions = [];

            for (const ailmentId in ailments) {
                const id = ailments[ailmentId].id;
                const ailmentData = ailments[ailmentId];
                const nameKey = this.showTCheaders ? 
                    `SMT_X.AffinityBS_TC.${ailmentData.id}` :
                    `SMT_X.AffinityBS.${ailmentData.id}`;
                const langName = coreModule.api.Utils.i18n(nameKey);
                const name = langName != nameKey ? langName : ailmentData.name;
                const listName = `${actionTypeName ? `${actionTypeName}: ` : ""}${name}`;
                const encodedValue = [actionTypeId, id].join(this.delimiter);

                const img = coreModule.api.Utils.getImage(ailmentData.img);

                const statusFound = this.actor.statuses.find(s => s == id);
                const active = statusFound ? " active" : "";
                const cssClass = `toggle${active}`;

                actions.push({
                    id,
                    name,
                    listName,
                    encodedValue,
                    img,
                    cssClass
                });
            };

            this.addActions(actions, groupData);
        }

        /**
         * Build utility
         * @private
         */
        async #buildUtility () {}

        /**
         * Get actions
         * @private
         */
        #getItemActions (typeMap, actionTypeId) {
            return [...typeMap].map(([itemId, itemData]) => {
                const id = itemId;
                const name = itemData.name;
                const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
                const listName = `${actionTypeName ? `${actionTypeName}: ` : ""}${name}`;
                const encodedValue = [actionTypeId, id].join(this.delimiter);

                const img = coreModule.api.Utils.getImage(itemData.img);

                const active = actionTypeId == "gear" && itemData.system.equipped ? " active" : "";
                const cssClass = `toggle${active}`; 

                let info1 = "";
                if (itemData.type == "consumable") {
                    info1 = { text: itemData.system.quantity };
                } else if (this.#derivedActions.get(itemId)) {
                    const suffix = ["dodge","talk"].includes(itemId) ? 
                        "%" : `+${this.actor.system.powerDice[itemId]}d10`;
                    info1 = { text: `${this.actor.system[this.#derivedStats[itemId]]}${suffix}` };
                }

                return {
                    id,
                    name,
                    info1,
                    listName,
                    encodedValue,
                    img,
                    cssClass
                }
            })
        }
    };
});
