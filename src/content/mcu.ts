/**
 * Defaults of the "Vers le microcontrôleur" panels, which the handouts do
 * not give (errata E-AE27 and E-TS11). Every one is adjustable on the page.
 */
import aeTp2Source from '../../matlab/automatique/tp2_discretisation.m?raw'
import { defaults } from '../engine/matlabScript'

/** Supply voltage of the motor, Tableau 2.1 (the TP2 script's U). */
const U_SUPPLY = defaults(aeTp2Source).U as number

export const MCU_DEFAULTS = {
  /** inflow of the tank: cannot be negative; its maximum is a choice */
  reservoir: { umin: 0, umax: 0.5 },
  /** motor voltage: the supply, both signs */
  moteur: { umin: -U_SUPPLY, umax: U_SUPPLY },
  /** sampling frequency of the IIR filter (given in normalized frequency) */
  filtreFe: 1000,
}
