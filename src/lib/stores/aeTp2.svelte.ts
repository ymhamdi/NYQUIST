/** The Automatique TP2 page store: the submitted script + the engine model. */
import source from '../../../matlab/automatique/tp2_discretisation.m?raw'
import type { ParamValue } from '../../engine/matlabScript'
import { aeTp2, type AeTp2Params } from '../../engine/tp/aeTp2'
import { createTpStore } from '../tpStore.svelte'

export const SCRIPT_NAME = 'tp2_discretisation.m'
export const SCRIPT_SOURCE = source

export const tp2 = createTpStore('ae-tp2', source, (p: Record<string, ParamValue>) => aeTp2(p as unknown as AeTp2Params))
