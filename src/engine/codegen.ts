/**
 * C code for a microcontroller, generated from the engine's digital
 * controllers (mcu.ts): the same operations in the same order, so that a
 * test can compile the C with gcc and compare it with mcu.ts sample by
 * sample. Targets: portable C, Arduino Uno (Timer1 interrupt), STM32 HAL
 * (timer callback). Comments in the generated code are in French, for the
 * student who flashes it.
 */
import { derivPole, discretePid, normalize, type Limits, type PidGains } from './mcu'

export type Target = 'c' | 'arduino' | 'stm32'

export interface PidSpec {
  kind: 'pid'
  /** C identifier prefix, e.g. "reservoir" */
  name: string
  /** French description, e.g. "Hauteur d'eau du réservoir (TP4)" */
  title: string
  gains: PidGains
  limits: Limits | null
  antiWindup: boolean
  setpoint: number
  /** French names with units, e.g. "hauteur H (m)" */
  measure: string
  command: string
}

export interface FilterSpec {
  kind: 'filter'
  name: string
  title: string
  /** powers of z⁻¹ */
  b: number[]
  a: number[]
  Fe: number
  /** fractional bits of the int16 coefficients (Qm.n), or null for floating point */
  frac: number | null
}

export type Spec = PidSpec | FilterSpec

export interface Generated {
  filename: string
  code: string
}

/** Shortest decimal that reads back as the same double, always a floating literal. */
export function cNumber(v: number): string {
  if (!Number.isFinite(v)) throw new Error(`cNumber: ${v}`)
  const s = String(v)
  return /[.eE]/.test(s) ? s : `${s}.0`
}
const real = (v: number) => `((nyq_real)${cNumber(v)})`
const list = (xs: readonly number[], f: (v: number) => string) => xs.map(f).join(', ')
const human = (v: number) => String(Number(v.toPrecision(6)))

const REAL_TYPE = `#ifndef NYQ_REAL
#define NYQ_REAL float  /* double pour vérifier sur PC : gcc -DNYQ_REAL=double */
#endif
typedef NYQ_REAL nyq_real;`

function pidCore(s: PidSpec): string {
  const P = s.name.toUpperCase()
  const g = s.gains
  const { b, a } = discretePid(g)
  const lim = s.limits
  const clamp = (v: string) => `(${v} > ${P}_UMAX) ? ${P}_UMAX : ((${v} < ${P}_UMIN) ? ${P}_UMIN : ${v})`
  let sat = ''
  if (lim && s.antiWindup) {
    sat = `
  if (u > ${P}_UMAX || u < ${P}_UMIN) {
    const nyq_real u_sat = (u > ${P}_UMAX) ? ${P}_UMAX : ${P}_UMIN;
    if ((e > 0) == (u > u_sat)) {
      /* anti-windup : l'écart pousse encore vers la butée, on n'intègre pas */
      i = s->integrale;
      u = p + i + d;
      u = ${clamp('u')};
    } else {
      u = u_sat;
    }
  }`
  } else if (lim) {
    sat = `
  if (u > ${P}_UMAX || u < ${P}_UMIN) {
    u = (u > ${P}_UMAX) ? ${P}_UMAX : ${P}_UMIN;   /* saturation, sans anti-windup */
  }`
  }
  return `/* Régulateur PID numérique : ${s.title}
 * Te = ${human(g.Ts)} s, kp = ${human(g.kp)}, ki = ${human(g.ki)}, kd = ${human(g.kd)}, N = ${human(g.N)}
 *   e[n] = consigne - mesure
 *   I[n] = I[n-1] + ki*Te*e[n]                              (intégrale, Euler arrière)
 *   D[n] = (D[n-1] + kd*N*(e[n] - e[n-1])) / (1 + N*Te)    (dérivée filtrée, Euler arrière)
 *   u[n] = kp*e[n] + I[n] + D[n]${lim ? `, saturée entre ${human(lim.umin)} et ${human(lim.umax)}` : ''}
 * Sans saturation, c'est l'équation aux différences
 *   u[n] = ${b.map((v, k) => `${human(v)}*e[n-${k}]`).join(' + ').replace(/\+ -/g, '- ').replace('e[n-0]', 'e[n]')}${a
    .slice(1)
    .map((v, k) => ` ${v > 0 ? '-' : '+'} ${human(Math.abs(v))}*u[n-${k + 1}]`)
    .join('')}
 */
#define ${P}_KP    ${real(g.kp)}
#define ${P}_KI_TE ${real(g.ki * g.Ts)}   /* ki*Te */
#define ${P}_KD_N  ${real(g.kd * g.N)}   /* kd*N */
#define ${P}_C     ${real(derivPole(g))}   /* 1/(1 + N*Te) */${
    lim
      ? `
#define ${P}_UMIN  ${real(lim.umin)}   /* borne basse de la commande (${s.command}) */
#define ${P}_UMAX  ${real(lim.umax)}   /* borne haute de la commande (${s.command}) */`
      : ''
  }

typedef struct {
  nyq_real integrale;   /* I[n-1] */
  nyq_real derivee;     /* D[n-1] */
  nyq_real ecart_prec;  /* e[n-1] */
} ${s.name}_etat_t;     /* à mettre à zéro au démarrage */

/* Une période d'échantillonnage : renvoie la commande (${s.command}). */
static inline nyq_real ${s.name}_pas(${s.name}_etat_t *s, nyq_real consigne, nyq_real mesure) {
  const nyq_real e = consigne - mesure;
  const nyq_real p = ${P}_KP * e;
  const nyq_real d = ${P}_C * (s->derivee + ${P}_KD_N * (e - s->ecart_prec));
  nyq_real i = s->integrale + ${P}_KI_TE * e;
  nyq_real u = p + i + d;${sat}
  s->integrale = i;
  s->derivee = d;
  s->ecart_prec = e;
  return u;
}`
}

function filterCore(s: FilterSpec): string {
  const { b, a } = normalize(s.b, s.a)
  const P = s.name.toUpperCase()
  const diff = `y[n] = ${b.map((v, k) => `${human(v)}*x[n-${k}]`).join(' + ')}${a
    .slice(1)
    .map((v, k) => ` ${v > 0 ? '-' : '+'} ${human(Math.abs(v))}*y[n-${k + 1}]`)
    .join('')}`
    .replace(/\+ -/g, '- ')
    .replace('x[n-0]', 'x[n]')
  const head = `/* Filtre numérique (forme directe I) : ${s.title}
 * Fe = ${human(s.Fe)} Hz
 *   ${diff}`
  const shift = (arr: string, n: string, v: string) => `  for (k = ${n} - 1; k > 0; k--) s->${arr}[k] = s->${arr}[k - 1];
  s->${arr}[0] = ${v};`
  if (s.frac === null) {
    return `${head}
 */
#define ${P}_NB ${b.length}
#define ${P}_NA ${a.length}
static const nyq_real ${s.name}_b[${P}_NB] = { ${list(b, real)} };
static const nyq_real ${s.name}_a[${P}_NA] = { ${list(a, real)} };

typedef struct {
  nyq_real x[${P}_NB];      /* x[n], x[n-1], ... */
  nyq_real y[${P}_NA - 1];  /* y[n-1], y[n-2], ... */
} ${s.name}_etat_t;         /* à mettre à zéro au démarrage */

static inline nyq_real ${s.name}_pas(${s.name}_etat_t *s, nyq_real x) {
  int k;
  nyq_real acc = 0;
${shift('x', `${P}_NB`, 'x')}
  for (k = 0; k < ${P}_NB; k++) acc += ${s.name}_b[k] * s->x[k];
  for (k = 1; k < ${P}_NA; k++) acc -= ${s.name}_a[k] * s->y[k - 1];
${shift('y', `${P}_NA - 1`, 'acc')}
  return acc;
}`
  }
  const f = s.frac
  const q = (v: number) => Math.round(v * 2 ** f)
  const ints = [...b, ...a].map(q)
  if (ints.some((v) => v > 32767 || v < -32768)) throw new Error('filterCore: coefficients do not fit int16 with these fractional bits')
  return `${head}
 * Virgule fixe : coefficients int16 au format Q${15 - f}.${f} (valeur = entier / 2^${f}),
 * échantillons int16, accumulateur 64 bits, arrondi puis saturation à int16.
 * Coefficients quantifiés : b = [${b.map((v) => human(q(v) / 2 ** f)).join(' ')}], a = [${a.map((v) => human(q(v) / 2 ** f)).join(' ')}]
 */
#define ${P}_NB ${b.length}
#define ${P}_NA ${a.length}
#define ${P}_FRAC ${f}
static const int16_t ${s.name}_b[${P}_NB] = { ${b.map(q).join(', ')} };
static const int16_t ${s.name}_a[${P}_NA] = { ${a.map(q).join(', ')} };

typedef struct {
  int16_t x[${P}_NB];
  int16_t y[${P}_NA - 1];
} ${s.name}_etat_t;         /* à mettre à zéro au démarrage */

static inline int16_t ${s.name}_pas(${s.name}_etat_t *s, int16_t x) {
  int k;
  int64_t acc = 0;
${shift('x', `${P}_NB`, 'x')}
  for (k = 0; k < ${P}_NB; k++) acc += (int32_t)${s.name}_b[k] * s->x[k];
  for (k = 1; k < ${P}_NA; k++) acc -= (int32_t)${s.name}_a[k] * s->y[k - 1];
  acc = (acc + ((int64_t)1 << (${P}_FRAC - 1))) >> ${P}_FRAC;   /* arrondi (décalage arithmétique) */
  if (acc > 32767) acc = 32767;
  if (acc < -32768) acc = -32768;
${shift('y', `${P}_NA - 1`, '(int16_t)acc')}
  return (int16_t)acc;
}`
}

const PRESCALERS: [number, string][] = [
  [1, '(1 << CS10)'],
  [8, '(1 << CS11)'],
  [64, '(1 << CS11) | (1 << CS10)'],
  [256, '(1 << CS12)'],
  [1024, '(1 << CS12) | (1 << CS10)'],
]

/** Timer1 of the ATmega328P at 16 MHz in CTC mode: prescaler, OCR1A and a software divider for long periods. */
export function avrTimer1(Ts: number) {
  const fcpu = 16e6
  const maxPeriod = (65536 * 1024) / fcpu
  const divider = Math.max(1, Math.ceil(Ts / maxPeriod - 1e-12))
  const tick = Ts / divider
  for (const [p, bits] of PRESCALERS) {
    const ocr = Math.round((fcpu * tick) / p) - 1
    if (ocr <= 65535) {
      if (ocr < 1) throw new Error('avrTimer1: period too short')
      const real = (divider * (ocr + 1) * p) / fcpu
      return { prescaler: p, bits, ocr, divider, real, error: real / Ts - 1 }
    }
  }
  throw new Error('avrTimer1: no prescaler fits')
}

function core(s: Spec) {
  return s.kind === 'pid' ? pidCore(s) : filterCore(s)
}

function arduino(s: Spec): string {
  const Ts = s.kind === 'pid' ? s.gains.Ts : 1 / s.Fe
  const t = avrTimer1(Ts)
  const pct = Math.abs(t.error) < 1e-12 ? 'exacte' : `écart ${human(t.error * 100)} %`
  let io: string
  let task: string
  if (s.kind === 'pid') {
    const lo = s.limits?.umin ?? 0
    const hi = s.limits?.umax ?? 1
    io = `#define CONSIGNE ${real(s.setpoint)}   /* ${s.measure} visée */

/* À adapter au capteur : tension lue sur A0 (0..1023 -> 0..5 V) convertie en ${s.measure}. */
#define MESURE_ECHELLE  ((nyq_real)(5.0 / 1023.0))
#define MESURE_DECALAGE ((nyq_real)0.0)
static nyq_real lire_mesure(void) {
  return (nyq_real)analogRead(A0) * MESURE_ECHELLE + MESURE_DECALAGE;
}

/* ${s.command} : ${human(lo)} .. ${human(hi)} -> PWM 0..255 sur la broche 3 (Timer2 ; le Timer1 sert à l'échantillonnage).${
      s.limits ? '' : '\n * Pas de saturation dans le régulateur : plage de la PWM à adapter.'
    } */
static void ecrire_commande(nyq_real u) {
  nyq_real r = (u - ${real(lo)}) * ((nyq_real)255.0 / ${real(hi - lo)});
  if (r < 0) r = 0;
  if (r > 255) r = 255;
  analogWrite(3, (int)(r + (nyq_real)0.5));
}

static ${s.name}_etat_t etat;`
    task = `    const nyq_real y = lire_mesure();
    ecrire_commande(${s.name}_pas(&etat, CONSIGNE, y));`
  } else {
    const fixed = s.frac !== null
    io = `/* Entrée : A0 (0..1023), centrée sur 512. Sortie : PWM sur la broche 3 (Timer2), centrée sur 128. */
static ${s.name}_etat_t etat;`
    task = fixed
      ? `    const int16_t x = (int16_t)(analogRead(A0) - 512);
    int16_t y = ${s.name}_pas(&etat, x);
    int r = y / 4 + 128;
    analogWrite(3, r < 0 ? 0 : (r > 255 ? 255 : r));`
      : `    const nyq_real x = (nyq_real)(analogRead(A0) - 512);
    const nyq_real y = ${s.name}_pas(&etat, x);
    int r = (int)(y / 4) + 128;
    analogWrite(3, r < 0 ? 0 : (r > 255 ? 255 : r));`
  }
  return `/* ===== Arduino Uno (ATmega328P, 16 MHz) — généré par Nyquist =====
 * ${s.title}
 * Échantillonnage par interruption du Timer1 (mode CTC) : Te = ${human(Ts)} s.
 * Prédiviseur ${t.prescaler}, OCR1A = ${t.ocr}${t.divider > 1 ? `, une interruption sur ${t.divider} (période trop longue pour le Timer1 seul)` : ''}.
 * Période obtenue : ${human(t.real)} s (${pct}).
 * L'interruption ne fait que lever un drapeau ; le calcul se fait dans loop().
 */
#include <Arduino.h>
#include <stdint.h>

${REAL_TYPE}

${core(s)}

${io}

#define DIVISEUR ${t.divider}
static volatile uint8_t nouvelle_periode = 0;

ISR(TIMER1_COMPA_vect) {
  static uint16_t n = 0;
  if (++n >= DIVISEUR) {
    n = 0;
    nouvelle_periode = 1;
  }
}

void setup() {
  pinMode(3, OUTPUT);
  noInterrupts();
  TCCR1A = 0;
  TCCR1B = 0;
  TCNT1 = 0;
  OCR1A = ${t.ocr};
  TCCR1B |= (1 << WGM12);               /* mode CTC */
  TCCR1B |= ${t.bits};   /* prédiviseur ${t.prescaler} */
  TIMSK1 |= (1 << OCIE1A);              /* interruption sur comparaison */
  interrupts();
}

void loop() {
  if (nouvelle_periode) {
    nouvelle_periode = 0;
${task}
  }
}
`
}

function stm32(s: Spec): string {
  const Ts = s.kind === 'pid' ? s.gains.Ts : 1 / s.Fe
  const arr = Math.round(Ts * 1e6) - 1
  const fixed = s.kind === 'filter' && s.frac !== null
  const sample = fixed ? 'int16_t' : 'nyq_real'
  const task =
    s.kind === 'pid'
      ? `    ecrire_commande(${s.name}_pas(&etat, consigne, lire_mesure()));`
      : `    ecrire_sortie(${s.name}_pas(&etat, lire_entree()));`
  const io =
    s.kind === 'pid'
      ? `/* À adapter : mesure de la ${s.measure} et commande (${s.command}).
 * Exemple ADC : HAL_ADC_Start(&hadc1); HAL_ADC_PollForConversion(&hadc1, 1);
 *               return HAL_ADC_GetValue(&hadc1) * (3.3f / 4095.0f);
 * Exemple PWM : __HAL_TIM_SET_COMPARE(&htim3, TIM_CHANNEL_1, rapport_cyclique); */
__attribute__((weak)) nyq_real lire_mesure(void) { return 0; }
__attribute__((weak)) void ecrire_commande(nyq_real u) { (void)u; }

static nyq_real consigne = ${real(s.setpoint)};   /* ${s.measure} visée */`
      : `/* À adapter : lecture de l'ADC (centrée sur 0) et sortie (DAC ou PWM). */
__attribute__((weak)) ${sample} lire_entree(void) { return 0; }
__attribute__((weak)) void ecrire_sortie(${sample} y) { (void)y; }`
  return `/* ===== STM32 (HAL, STM32CubeIDE) — généré par Nyquist =====
 * ${s.title}
 * À ajouter dans main.c. Dans CubeMX : TIM2 (32 bits) en Internal Clock, interruption
 * globale activée. Horloge du timer à 84 MHz (STM32F4) : Prescaler = 83 (1 MHz),
 * Counter Period = ${arr} -> Te = ${human(Ts)} s. Pour une autre horloge f :
 * Prescaler = f / 1 MHz - 1. Démarrer avec HAL_TIM_Base_Start_IT(&htim2) et appeler
 * nyquist_tache() dans la boucle while (1). Si main.c définit déjà
 * HAL_TIM_PeriodElapsedCallback, y ajouter le test sur TIM2.
 */
#include "main.h"
#include <stdint.h>

${REAL_TYPE}

${core(s)}

${io}

static ${s.name}_etat_t etat;
static volatile uint8_t nouvelle_periode = 0;

void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim) {
  if (htim->Instance == TIM2) {
    nouvelle_periode = 1;
  }
}

void nyquist_tache(void) {
  if (nouvelle_periode) {
    nouvelle_periode = 0;
${task}
  }
}
`
}

function portable(s: Spec): string {
  const call =
    s.kind === 'pid'
      ? `u = ${s.name}_pas(&etat, consigne, mesure);`
      : `y = ${s.name}_pas(&etat, x);`
  const Ts = s.kind === 'pid' ? s.gains.Ts : 1 / s.Fe
  return `/* ===== C portable — généré par Nyquist =====
 * ${s.title}
 * Appeler ${s.name}_pas() une fois par période Te = ${human(Ts)} s (interruption d'un timer) :
 *   static ${s.name}_etat_t etat;   (à zéro au démarrage)
 *   ${call}
 */
#include <stdint.h>

${REAL_TYPE}

${core(s)}
`
}

export function generateC(s: Spec, target: Target): Generated {
  if (!/^[a-z][a-z0-9_]*$/.test(s.name)) throw new Error(`generateC: invalid name ${s.name}`)
  if (target === 'arduino') return { filename: `${s.name}.ino`, code: arduino(s) }
  if (target === 'stm32') return { filename: `${s.name}_stm32.c`, code: stm32(s) }
  return { filename: `${s.name}.c`, code: portable(s) }
}
