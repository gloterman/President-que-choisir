import type { Candidate, PoliticalFamily } from '../types'
import { attal } from './attal'
import { bardella } from './bardella'
import { batho } from './batho'
import { bertrand } from './bertrand'
import { glucksmann } from './glucksmann'
import { lepen } from './lepen'
import { lisnard } from './lisnard'
import { melenchon } from './melenchon'
import { philippe } from './philippe'
import { retailleau } from './retailleau'
import { roussel } from './roussel'
import { ruffin } from './ruffin'
import { tondelier } from './tondelier'
import { villepin } from './villepin'
import { zemmour } from './zemmour'

/**
 * Ordre d'affichage par défaut : de la gauche radicale à la droite nationale.
 * Cet ordre est une convention de lecture, pas un classement.
 */
export const candidates: Candidate[] = [
  melenchon,
  roussel,
  ruffin,
  batho,
  tondelier,
  glucksmann,
  villepin,
  attal,
  philippe,
  bertrand,
  lisnard,
  retailleau,
  lepen,
  bardella,
  zemmour,
]

export const candidateById = new Map(candidates.map((c) => [c.id, c]))

export const FAMILIES: Record<PoliticalFamily, { lastName: string; order: number }> = {
  'gauche-radicale': { lastName: 'Gauche radicale', order: 1 },
  gauche: { lastName: 'Gauche', order: 2 },
  ecologie: { lastName: 'Écologie', order: 3 },
  centre: { lastName: 'Centre', order: 4 },
  droite: { lastName: 'Droite', order: 5 },
  'droite-nationale': { lastName: 'Droite nationale', order: 6 },
  divers: { lastName: 'Divers', order: 7 },
}

export const CANDIDACY_STATUSES = {
  declare: { lastName: 'Candidature déclarée', summary: 'A annoncé publiquement sa candidature.' },
  pressenti: { lastName: 'Pressenti', summary: 'Cité comme candidat probable par son camp, sans annonce officielle.' },
  hypothetique: {
    lastName: 'Hypothèse',
    summary: 'Candidature incertaine à ce stade, pour des raisons politiques ou juridiques.',
  },
} as const
