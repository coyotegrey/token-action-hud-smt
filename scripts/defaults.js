import { GROUP } from './constants.js';

/**
 * Default layout and groups
 */
export let DEFAULTS = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    const showTCheaders = game.settings.get("smt-200x", "showTCheaders");
    const ailmentsTitle = showTCheaders ? coreModule.api.Utils.i18n("SMT_X.AffinityBS_TC.BS") :
        coreModule.api.Utils.i18n("SMT_X.AffinityBS.BS");
    
    const groups = GROUP;
    Object.values(groups).forEach(group => {
        group.name = group.id == "ailments" ? ailmentsTitle : coreModule.api.Utils.i18n(group.name);
        group.listName = `Group: ${coreModule.api.Utils.i18n(group.listName ?? group.name)}`;
    });
    const groupsArray = Object.values(groups);
    DEFAULTS = {
        layout: [
            {
                nestId: 'stats',
                id: 'stats',
                name: coreModule.api.Utils.i18n('tokenActionHud.smt.stats'),
                groups: [
                    { ...groups.stats, nestId: 'stats_stats' },
                    { ...groups.derived, nestId: 'stats_derived' }
                ]
            },
            {
                nestId: 'features',
                id: 'features',
                name: coreModule.api.Utils.i18n('tokenActionHud.smt.actions'),
                groups: [
                    { ...groups.features, nestId: 'features_features' },
                    { ...groups.passives, nestId: 'features_passives' }
                ],
                settings: { customWidth: 500 }
            },
            {
                nestId: 'gear',
                id: 'gear',
                name: coreModule.api.Utils.i18n('tokenActionHud.smt.items'),
                groups: [
                    { ...groups.consumables, nestId: 'gear_consumables' },
                    { ...groups.armor, nestId: 'gear_armor' },
                    { ...groups.weapons, nestId: 'gear_weapons' }
                ]
            },
            {
                nestId: 'ailments',
                id: 'ailments',
                name: ailmentsTitle,
                groups: [
                    { ...groups.ailments, nestId: 'ailments_ailments'}
                ]
            },
            {
                nestId: 'utility',
                id: 'utility',
                name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
                groups: [
                    { ...groups.combat, nestId: 'utility_combat' },
                    { ...groups.token, nestId: 'utility_token' },
                    { ...groups.rests, nestId: 'utility_rests' },
                    { ...groups.utility, nestId: 'utility_utility' }
                ]
            }
        ],
        groups: groupsArray
    };
});
