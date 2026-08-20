import { Link } from 'react-router-dom'
import { candidats } from '@/data/candidats'
import { Alerte } from './ui/base'

const elements = candidats.flatMap((c) => [...c.mesures, ...c.faits, ...c.judiciaire, ...c.indicateurs])
const verifies = elements.filter((e) => e.verification === 'verifie').length

/**
 * Bandeau affiché en tête des pages qui exposent des faits.
 *
 * Il énonce sans détour l'état réel du jeu de données. Tant que la part de
 * données vérifiées n'est pas significative, le dire est la seule manière
 * honnête de présenter des notes portant sur des personnes réelles.
 */
export function BandeauDonnees() {
  return (
    <Alerte titre={`Jeu de données en cours de vérification — ${verifies} élément(s) sur ${elements.length} recoupés sur source primaire`}>
      Les positions programmatiques sont des synthèses éditoriales, les faits et décisions de
      justice sont saisis mais pas encore recoupés un à un. Ne tenez aucun élément pour établi
      avant de l’avoir vérifié : chaque affirmation porte son statut et ses sources.{' '}
      <Link to="/sources" className="font-medium text-accent hover:underline">
        Voir l’état de vérification
      </Link>
      .
    </Alerte>
  )
}
