/** The Automatique TP3 page store: the submitted script + the engine model. */
import source from '../../../matlab/automatique/tp3_stabilite_precision.m?raw'
import type { ParamValue } from '../../engine/matlabScript'
import { aeTp3, type AeTp3Params } from '../../engine/tp/aeTp3'
import { createTpStore } from '../tpStore.svelte'

export const SCRIPT_NAME = 'tp3_stabilite_precision.m'
export const SCRIPT_SOURCE = source

export const tp3 = createTpStore('ae-tp3', source, (p: Record<string, ParamValue>) => aeTp3(p as unknown as AeTp3Params))
