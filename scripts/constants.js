/**
 * Module-based constants
 */
export const MODULE = {
    ID: 'token-action-hud-smt'
};

/**
 * Core module
 */
export const CORE_MODULE = {
    ID: 'token-action-hud-core'
};

/**
 * Core module version required by the system module
 */
export const REQUIRED_CORE_MODULE_VERSION = '2.0';

/**
 * Action types
 */
export const ACTION_TYPE = {
    stat: 'tokenActionHud.smt.stat',
    feature: 'tokenActionHud.smt.action',
    gear: 'tokenActionHud.smt.item',
    ailment: 'tokenActionHud.smt.ailment',
    utility: 'tokenActionHud.utility'
};

/**
 * Groups
 */
export const GROUP = {
    stats: { id: 'stats', name: 'tokenActionHud.smt.stats', type: 'system' },
    derived: { id: 'derived', name: 'tokenActionHud.smt.derived', type: 'system' },

    features: { id: 'features', name: 'tokenActionHud.smt.actions', type: 'system' },
    passives: { id: 'passives', name: 'tokenActionHud.smt.passives', type: 'system' },

    consumables: { id: 'consumables', name: 'tokenActionHud.smt.consumables', type: 'system' },
    armor: { id: 'armor', name: 'tokenActionHud.smt.armor', type: 'system' },
    weapons: { id: 'weapons', name: 'tokenActionHud.smt.weapons', type: 'system' },
 
    ailments: { id: 'ailments', name: 'SMT_X.AffinityBS.BS', type: 'system' },

    combat: { id: 'combat', name: 'tokenActionHud.combat', type: 'system' },
    token: { id: 'token', name: 'tokenActionHud.token', type: 'system' },
    rests: { id: 'rests', name: 'tokenActionHud.smt.rest', type: 'system' },
    utility: { id: 'utility', name: 'tokenActionHud.utility', type: 'system' }
};

/**
 * Item types
 */
export const ITEM_TYPE = {
    feature: { groupId: 'features' },
    passive: { groupId: 'passives' },
    consumable: { groupId: 'consumables' },
    armor: { groupId: 'armor' },
    weapon: { groupId: 'weapons' }
};
