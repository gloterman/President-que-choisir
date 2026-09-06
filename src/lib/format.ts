import type { Confidence, LegalStatus, Verification } from '@/data/types'

export const percent = (v: number, decimals = 0): string =>
  `${v.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} %`

export const rating100 = (v: number): string => Math.round(v).toLocaleString('fr-FR')

export const billions = (v: number): string =>
  `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Md€`

export function formatDate(iso: string): string {
  const chunks = iso.split('-')
  if (chunks.length === 1) return chunks[0]
  const month = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  const monthName = month[Number(chunks[1]) - 1] ?? ''
  if (chunks.length === 2) return `${monthName} ${chunks[0]}`
  return `${Number(chunks[2])} ${monthName} ${chunks[0]}`
}

export function age(birthIso: string, reference = new Date()): number {
  const birth = new Date(birthIso)
  let years = reference.getFullYear() - birth.getFullYear()
  const month = reference.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && reference.getDate() < birth.getDate())) years--
  return years
}

export type Tone = 'neutre' | 'accent' | 'good' | 'warning' | 'serious' | 'critical'

export const VERIFICATION: Record<
  Verification,
  { label: string; tone: Tone; icon: string; explanation: string }
> = {
  verifie: {
    label: 'Vérifié',
    tone: 'good',
    icon: '✓',
    explanation: 'Recoupé sur une source primaire.',
  },
  recoupe: {
    label: 'Recoupé',
    tone: 'accent',
    icon: '⊙',
    explanation:
      'Recoupé sur au moins deux sources indépendantes et concordantes. La source primaire est référencée mais n’a pas été ouverte directement : il reste une lecture du document à faire avant de tenir le fait pour définitivement établi.',
  },
  'a-verifier': {
    label: 'À vérifier',
    tone: 'warning',
    icon: '!',
    explanation:
      'Saisi depuis une source secondaire, en attente de recoupement sur une source primaire. À ne pas tenir pour établi.',
  },
  estimation: {
    label: 'Estimation',
    tone: 'serious',
    icon: '≈',
    explanation:
      'Synthèse éditoriale d’une ligne politique, et non une citation. Contestable par nature.',
  },
}

export const CONFIDENCE: Record<Confidence, { label: string; explanation: string }> = {
  haute: { label: 'Confiance haute', explanation: 'Indicateurs complets et concordants.' },
  moyenne: { label: 'Confiance moyenne', explanation: 'Indicateurs partiels ou sources secondaires.' },
  faible: {
    label: 'Confiance faible',
    explanation: 'Données lacunaires : la note est indicative et doit être lue avec prudence.',
  },
}

export const LEGAL_STATUS: Record<
  LegalStatus,
  { label: string; tone: Tone; icon: string; explanation: string }
> = {
  'condamnation-definitive': {
    label: 'Condamnation définitive',
    tone: 'critical',
    icon: '■',
    explanation: 'Toutes les voies de recours sont épuisées : la culpabilité est établie.',
  },
  'condamnation-appel-pourvoi': {
    label: 'Condamné en appel, pourvoi en cours',
    tone: 'serious',
    icon: '◆',
    explanation:
      'Les faits ont été jugés deux fois et la culpabilité retenue en appel. Un pourvoi en cassation est pendant : il ne rejuge pas les faits mais contrôle l’application du droit, et la condamnation n’est pas encore définitive.',
  },
  'condamnation-non-definitive': {
    label: 'Condamnation non définitive',
    tone: 'serious',
    icon: '◆',
    explanation:
      'Une juridiction a condamné, mais un appel ou un pourvoi est en cours : la présomption d’innocence demeure.',
  },
  'mise-en-examen': {
    label: 'Mise en examen',
    tone: 'warning',
    icon: '▲',
    explanation:
      'Des indices graves ou concordants justifient une enquête. Ce n’est ni une accusation définitive ni une condamnation.',
  },
  enquete: {
    label: 'Enquête en cours',
    tone: 'warning',
    icon: '▲',
    explanation: 'Une enquête est ouverte, sans mise en examen à ce stade.',
  },
  relaxe: {
    label: 'Relaxe',
    tone: 'good',
    icon: '✓',
    explanation: 'La juridiction a écarté la culpabilité.',
  },
  'non-lieu': {
    label: 'Non-lieu',
    tone: 'good',
    icon: '✓',
    explanation: 'L’instruction s’est achevée sans renvoi devant une juridiction de jugement.',
  },
  'classement-sans-suite': {
    label: 'Classement sans suite',
    tone: 'good',
    icon: '✓',
    explanation: 'Le parquet a décidé de ne pas engager de poursuites.',
  },
  prescription: {
    label: 'Prescription',
    tone: 'neutre',
    icon: '·',
    explanation: 'Les faits ne peuvent plus être poursuivis en raison du délai écoulé.',
  },
}

export const LIKERT: { value: -2 | -1 | 0 | 1 | 2; label: string; short: string }[] = [
  { value: -2, label: 'Pas du tout d’accord', short: '−−' },
  { value: -1, label: 'Plutôt pas d’accord', short: '−' },
  { value: 0, label: 'Sans opinion', short: '0' },
  { value: 1, label: 'Plutôt d’accord', short: '+' },
  { value: 2, label: 'Tout à fait d’accord', short: '++' },
]

export const IMPORTANCE: { value: 0 | 1 | 2 | 3; label: string; short: string }[] = [
  { value: 0, label: 'Peu importe', short: 'Peu importe' },
  { value: 1, label: 'Assez important', short: 'Assez' },
  { value: 2, label: 'Important', short: 'Important' },
  { value: 3, label: 'Décisif', short: 'Décisif' },
]

/** Libellé du palier atteint par une note, selon le barème du critère. */
export function tierOf(tiers: { min: number; label: string }[], rating: number): string {
  return [...tiers].sort((a, b) => b.min - a.min).find((p) => rating >= p.min)?.label ?? '—'
}

export const clsx = (...shares: (string | false | null | undefined)[]): string =>
  shares.filter(Boolean).join(' ')
