import { MODULE } from './constants.js'

/**
 * Register module settings
 * Called by Token Action HUD Core to register Token Action HUD system module settings
 * @param {function} coreUpdate Token Action HUD Core update function
 */
export function register (coreUpdate) {
    game.settings.register(MODULE.ID, 'sortAlpha', {
        name: game.i18n.localize('tokenActionHud.smt.settings.sortAlpha.name'),
        hint: game.i18n.localize('tokenActionHud.smt.settings.sortAlpha.hint'),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => {
            coreUpdate(value)
        }
    })
}
