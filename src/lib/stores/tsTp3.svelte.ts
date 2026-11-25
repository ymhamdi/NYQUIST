/** The Traitement du signal TP3 page store: the submitted script + the engine model. */
import source from '../../../matlab/signal/tp3_tfd.m?raw'
import type { ParamValue } from '../../engine/matlabScript'
import { tsTp3, type TsTp3Params } from '../../engine/tp/tsTp3'
import { createTpStore } from '../tpStore.svelte'

export const SCRIPT_NAME = 'tp3_tfd.m'
export const SCRIPT_SOURCE = source

export const ts3 = createTpStore('ts-tp3', source, (p: Record<string, ParamValue>) => tsTp3(p as unknown as TsTp3Params))
