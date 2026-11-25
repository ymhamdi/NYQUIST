/** The Automatique TP1 page store: the submitted script + the engine model. */
import source from '../../../matlab/automatique/tp1_simulink_premier_ordre.m?raw'
import type { ParamValue } from '../../engine/matlabScript'
import { aeTp1, type AeTp1Params } from '../../engine/tp/aeTp1'
import { createTpStore } from '../tpStore.svelte'

export const SCRIPT_NAME = 'tp1_simulink_premier_ordre.m'
export const SCRIPT_SOURCE = source

export const tp1 = createTpStore('ae-tp1', source, (p: Record<string, ParamValue>) => aeTp1(p as unknown as AeTp1Params))
