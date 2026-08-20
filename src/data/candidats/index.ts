import type { Candidat, FamillePolitique } from '../types'
import { attal } from './attal'
import { bardella } from './bardella'
import { glucksmann } from './glucksmann'
import { lepen } from './lepen'
import { melenchon } from './melenchon'
import { philippe } from './philippe'
import { retailleau } from './retailleau'
import { roussel } from './roussel'
import { ruffin } from './ruffin'
import { tondelier } from './tondelier'
import { zemmour } from './zemmour'

/**
 * Ordre d'affichage par défaut : de la gauche radicale à la droite nationale.
 * Cet ordre est une convention de lecture, pas un classement.
 */
export const candidats: Candidat[] = [
  melenchon,
  roussel,
  ruffin,
  tondelier,
  glucksmann,
  attal,
  philippe,
  retailleau,
  lepen,
  bardella,
  zemmour,
]

export const candidatById = new Map(candidats.map((c) => [c.id, c]))

export const FAMILLES: Record<FamillePolitique, { nom: string; ordre: number }> = {
  'gauche-radicale': { nom: 'Gauche radicale', ordre: 1 },
  gauche: { nom: 'Gauche', ordre: 2 },
  ecologie: { nom: 'Écologie', ordre: 3 },
  centre: { nom: 'Centre', ordre: 4 },
  droite: { nom: 'Droite', ordre: 5 },
  'droite-nationale': { nom: 'Droite nationale', ordre: 6 },
  divers: { nom: 'Divers', ordre: 7 },
}

export const STATUTS_CANDIDATURE = {
  declare: { nom: 'Candidature déclarée', resume: 'A annoncé publiquement sa candidature.' },
  pressenti: { nom: 'Pressenti', resume: 'Cité comme candidat probable par son camp, sans annonce officielle.' },
  hypothetique: {
    nom: 'Hypothèse',
    resume: 'Candidature incertaine à ce stade, pour des raisons politiques ou juridiques.',
  },
} as const
