/** Shared types for the handout content of every TP. */
export type QType = 'main' | 'matlab' | 'simulink' | 'interp'

export const QTYPE_LABEL: Record<QType, string> = {
  main: 'calcul à la main',
  matlab: 'MATLAB',
  simulink: 'Simulink',
  interp: 'interprétation',
}

export interface Question {
  /** handout number, also the MATLAB cell id */
  id: string
  /** number as printed */
  number: string
  text: string
  /** page of the fascicule; null when the statement is an unverified transcription */
  page: number | null
  types: QType[]
}

export interface TpMeta {
  course: string
  number: number
  title: string
  /** pages of the fascicule, or null when unverified */
  pages: string | null
  but?: string
  /** false when the statement comes from an unverified transcription */
  verified: boolean
}

export const findQuestion = (qs: Question[], id: string): Question => {
  const q = qs.find((x) => x.id === id)
  if (!q) throw new Error(`no question ${id}`)
  return q
}
