/** The Traitement du signal TP4 page store: the submitted script + the engine model. */
import source from '../../../matlab/signal/tp4_filtres_numeriques.m?raw'
import type { ParamValue } from '../../engine/matlabScript'
import { tsTp4, type TsTp4Params } from '../../engine/tp/tsTp4'
import { createTpStore } from '../tpStore.svelte'

export const SCRIPT_NAME = 'tp4_filtres_numeriques.m'
export const SCRIPT_SOURCE = source

export const ts4 = createTpStore('ts-tp4', source, (p: Record<string, ParamValue>) => tsTp4(p as unknown as TsTp4Params))
