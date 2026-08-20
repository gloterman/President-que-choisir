import { Link } from 'react-router-dom'
import { candidats } from '@/data/candidats'
import { Alerte } from './ui/base'

const elements = candidats.flatMap((c) => [...c.mesures, ...c.faits, ...c.judiciaire, ...c.indicateurs])
const verifies = elements.filter((e) => e.verification === 'verifie').length
const recoupes = elements.filter((e) => e.verification === 'recoupe').length

/**
 * Bandeau affiché en tête des pages qui exposent des faits.
 *
 * Il énonce sans détour l'état réel du jeu de données. Tant que la part de
 * données vérifiées n'est pas significative, le dire est la seule manière
 * honnête de présenter des notes portant sur des personnes réelles.
 */
export function BandeauDonnees() {
  return (
    <Alerte
      titre={`Jeu de données en cours de vérification — ${recoupes} élément(s) recoupés, ${verifies} lus sur source primaire, sur ${elements.length}`}
    >
      Les décisions de justice ont été recoupées sur plusieurs sources concordantes et leurs
      références primaires sont indiquées ; il reste à ouvrir ces documents un à un. Les positions
      programmatiques, elles, sont des synthèses éditoriales. Chaque affirmation porte son statut
      et ses sources.{' '}
      <Link to="/sources" className="font-medium text-accent hover:underline">
        Voir l’état de vérification
      </Link>
      .
    </Alerte>
  )
}
