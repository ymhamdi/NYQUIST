/** The Automatique TP4 page store: the submitted script + the engine model, split in parts. */
import source from '../../../matlab/automatique/tp4_regulation_pid.m?raw'
import { AE_TP4_PARTS, type aeTp4 } from '../../engine/tp/aeTp4'
import { createTpStore } from '../tpStore.svelte'

export const SCRIPT_NAME = 'tp4_regulation_pid.m'
export const SCRIPT_SOURCE = source

export const tp4 = createTpStore<ReturnType<typeof aeTp4>>('ae-tp4', source, AE_TP4_PARTS)
