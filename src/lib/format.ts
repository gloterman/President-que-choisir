import type { Confiance, StatutJudiciaire, Verification } from '@/data/types'

export const pourcent = (v: number, decimales = 0): string =>
  `${v.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`

export const note100 = (v: number): string => Math.round(v).toLocaleString('fr-FR')

export const milliards = (v: number): string =>
  `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Md€`

export function formatDate(iso: string): string {
  const morceaux = iso.split('-')
  if (morceaux.length === 1) return morceaux[0]
  const mois = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  const nomMois = mois[Number(morceaux[1]) - 1] ?? ''
  if (morceaux.length === 2) return `${nomMois} ${morceaux[0]}`
  return `${Number(morceaux[2])} ${nomMois} ${morceaux[0]}`
}

export function age(naissanceIso: string, reference = new Date()): number {
  const naissance = new Date(naissanceIso)
  let ans = reference.getFullYear() - naissance.getFullYear()
  const mois = reference.getMonth() - naissance.getMonth()
  if (mois < 0 || (mois === 0 && reference.getDate() < naissance.getDate())) ans--
  return ans
}

export type Ton = 'neutre' | 'accent' | 'good' | 'warning' | 'serious' | 'critical'

export const VERIFICATION: Record<
  Verification,
  { label: string; ton: Ton; icone: string; explication: string }
> = {
  verifie: {
    label: 'Vérifié',
    ton: 'good',
    icone: '✓',
    explication: 'Recoupé sur une source primaire.',
  },
  recoupe: {
    label: 'Recoupé',
    ton: 'accent',
    icone: '⊙',
    explication:
      'Recoupé sur au moins deux sources indépendantes et concordantes. La source primaire est référencée mais n’a pas été ouverte directement : il reste une lecture du document à faire avant de tenir le fait pour définitivement établi.',
  },
  'a-verifier': {
    label: 'À vérifier',
    ton: 'warning',
    icone: '!',
    explication:
      'Saisi depuis une source secondaire, en attente de recoupement sur une source primaire. À ne pas tenir pour établi.',
  },
  estimation: {
    label: 'Estimation',
    ton: 'serious',
    icone: '≈',
    explication:
      'Synthèse éditoriale d’une ligne politique, et non une citation. Contestable par nature.',
  },
}

export const CONFIANCE: Record<Confiance, { label: string; explication: string }> = {
  haute: { label: 'Confiance haute', explication: 'Indicateurs complets et concordants.' },
  moyenne: { label: 'Confiance moyenne', explication: 'Indicateurs partiels ou sources secondaires.' },
  faible: {
    label: 'Confiance faible',
    explication: 'Données lacunaires : la note est indicative et doit être lue avec prudence.',
  },
}

export const STATUT_JUDICIAIRE: Record<
  StatutJudiciaire,
  { label: string; ton: Ton; icone: string; explication: string }
> = {
  'condamnation-definitive': {
    label: 'Condamnation définitive',
    ton: 'critical',
    icone: '■',
    explication: 'Toutes les voies de recours sont épuisées : la culpabilité est établie.',
  },
  'condamnation-appel-pourvoi': {
    label: 'Condamné en appel, pourvoi en cours',
    ton: 'serious',
    icone: '◆',
    explication:
      'Les faits ont été jugés deux fois et la culpabilité retenue en appel. Un pourvoi en cassation est pendant : il ne rejuge pas les faits mais contrôle l’application du droit, et la condamnation n’est pas encore définitive.',
  },
  'condamnation-non-definitive': {
    label: 'Condamnation non définitive',
    ton: 'serious',
    icone: '◆',
    explication:
      'Une juridiction a condamné, mais un appel ou un pourvoi est en cours : la présomption d’innocence demeure.',
  },
  'mise-en-examen': {
    label: 'Mise en examen',
    ton: 'warning',
    icone: '▲',
    explication:
      'Des indices graves ou concordants justifient une enquête. Ce n’est ni une accusation définitive ni une condamnation.',
  },
  enquete: {
    label: 'Enquête en cours',
    ton: 'warning',
    icone: '▲',
    explication: 'Une enquête est ouverte, sans mise en examen à ce stade.',
  },
  relaxe: {
    label: 'Relaxe',
    ton: 'good',
    icone: '✓',
    explication: 'La juridiction a écarté la culpabilité.',
  },
  'non-lieu': {
    label: 'Non-lieu',
    ton: 'good',
    icone: '✓',
    explication: 'L’instruction s’est achevée sans renvoi devant une juridiction de jugement.',
  },
  'classement-sans-suite': {
    label: 'Classement sans suite',
    ton: 'good',
    icone: '✓',
    explication: 'Le parquet a décidé de ne pas engager de poursuites.',
  },
  prescription: {
    label: 'Prescription',
    ton: 'neutre',
    icone: '·',
    explication: 'Les faits ne peuvent plus être poursuivis en raison du délai écoulé.',
  },
}

export const LIKERT: { valeur: -2 | -1 | 0 | 1 | 2; label: string; court: string }[] = [
  { valeur: -2, label: 'Pas du tout d’accord', court: '−−' },
  { valeur: -1, label: 'Plutôt pas d’accord', court: '−' },
  { valeur: 0, label: 'Sans opinion', court: '0' },
  { valeur: 1, label: 'Plutôt d’accord', court: '+' },
  { valeur: 2, label: 'Tout à fait d’accord', court: '++' },
]

export const IMPORTANCE: { valeur: 0 | 1 | 2 | 3; label: string; court: string }[] = [
  { valeur: 0, label: 'Peu importe', court: 'Peu importe' },
  { valeur: 1, label: 'Assez important', court: 'Assez' },
  { valeur: 2, label: 'Important', court: 'Important' },
  { valeur: 3, label: 'Décisif', court: 'Décisif' },
]

/** Libellé du palier atteint par une note, selon le barème du critère. */
export function palierDe(paliers: { min: number; label: string }[], note: number): string {
  return [...paliers].sort((a, b) => b.min - a.min).find((p) => note >= p.min)?.label ?? '—'
}

export const clsx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ')
