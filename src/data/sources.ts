import type { Source } from './types'

/**
 * Registre des sources.
 *
 * Convention retenue : on ne référence ici que des portails et des rubriques
 * dont l'adresse est stable. Le lien profond vers la décision, la déclaration
 * ou l'article précis est ajouté au moment de la vérification de chaque fait —
 * c'est précisément ce que signifie le passage de `a-verifier` à `verifie`.
 * Voir `docs/DONNEES.md` pour la procédure.
 */
export const sources: Source[] = [
  {
    id: 'hatvp',
    titre: 'Déclarations de patrimoine et d’intérêts',
    editeur: 'Haute Autorité pour la transparence de la vie publique',
    url: 'https://www.hatvp.fr/consulter-les-declarations/',
    date: '2026-01-01',
    type: 'institution',
  },
  {
    id: 'hatvp-repertoire',
    titre: 'Répertoire des représentants d’intérêts',
    editeur: 'Haute Autorité pour la transparence de la vie publique',
    url: 'https://www.hatvp.fr/le-repertoire/',
    date: '2026-01-01',
    type: 'institution',
  },
  {
    id: 'cnccfp',
    titre: 'Décisions sur les comptes de campagne',
    editeur: 'Commission nationale des comptes de campagne et des financements politiques',
    url: 'https://www.cnccfp.fr/',
    date: '2026-01-01',
    type: 'institution',
  },
  {
    id: 'legifrance',
    titre: 'Textes et jurisprudence',
    editeur: 'Légifrance',
    url: 'https://www.legifrance.gouv.fr/',
    date: '2026-01-01',
    type: 'officiel',
  },
  {
    id: 'courdecassation',
    titre: 'Décisions de la Cour de cassation',
    editeur: 'Cour de cassation',
    url: 'https://www.courdecassation.fr/decisions',
    date: '2026-01-01',
    type: 'officiel',
  },
  {
    id: 'assemblee',
    titre: 'Travaux et scrutins des députés',
    editeur: 'Assemblée nationale',
    url: 'https://www.assemblee-nationale.fr/dyn/deputes',
    date: '2026-01-01',
    type: 'officiel',
  },
  {
    id: 'senat',
    titre: 'Travaux et scrutins des sénateurs',
    editeur: 'Sénat',
    url: 'https://www.senat.fr/senateurs/senatl.html',
    date: '2026-01-01',
    type: 'officiel',
  },
  {
    id: 'nosdeputes',
    titre: 'Statistiques d’activité parlementaire',
    editeur: 'Regards Citoyens — NosDéputés.fr',
    url: 'https://www.nosdeputes.fr/',
    date: '2026-01-01',
    type: 'ong',
  },
  {
    id: 'datan',
    titre: 'Analyse des votes des députés',
    editeur: 'Datan',
    url: 'https://datan.fr/',
    date: '2026-01-01',
    type: 'ong',
  },
  {
    id: 'vie-publique',
    titre: 'Fiches biographiques et discours publics',
    editeur: 'Vie-publique.fr — Direction de l’information légale et administrative',
    url: 'https://www.vie-publique.fr/',
    date: '2026-01-01',
    type: 'officiel',
  },
  {
    id: 'journal-officiel',
    titre: 'Nominations et décrets',
    editeur: 'Journal officiel de la République française',
    url: 'https://www.legifrance.gouv.fr/jorf/jo',
    date: '2026-01-01',
    type: 'officiel',
  },
  {
    id: 'insee',
    titre: 'Données statistiques de référence',
    editeur: 'Insee',
    url: 'https://www.insee.fr/',
    date: '2026-01-01',
    type: 'institution',
  },
  {
    id: 'cour-des-comptes',
    titre: 'Rapports publics',
    editeur: 'Cour des comptes',
    url: 'https://www.ccomptes.fr/',
    date: '2026-01-01',
    type: 'institution',
  },
  {
    id: 'ofce',
    titre: 'Évaluations macroéconomiques des programmes',
    editeur: 'Observatoire français des conjonctures économiques',
    url: 'https://www.ofce.sciences-po.fr/',
    date: '2026-01-01',
    type: 'universitaire',
  },
  {
    id: 'institut-montaigne',
    titre: 'Chiffrage des programmes présidentiels',
    editeur: 'Institut Montaigne',
    url: 'https://www.institutmontaigne.org/',
    date: '2026-01-01',
    type: 'ong',
  },
  {
    id: 'ifrap',
    titre: 'Analyses des finances publiques',
    editeur: 'Fondation iFRAP',
    url: 'https://www.ifrap.org/',
    date: '2026-01-01',
    type: 'ong',
  },
  {
    id: 'decodeurs',
    titre: 'Vérifications factuelles — Les Décodeurs',
    editeur: 'Le Monde',
    url: 'https://www.lemonde.fr/les-decodeurs/',
    date: '2026-01-01',
    type: 'presse',
  },
  {
    id: 'vrai-ou-faux',
    titre: 'Vérifications factuelles — Vrai ou Faux',
    editeur: 'franceinfo',
    url: 'https://www.francetvinfo.fr/vrai-ou-fake/',
    date: '2026-01-01',
    type: 'presse',
  },
  {
    id: 'checknews',
    titre: 'Vérifications factuelles — CheckNews',
    editeur: 'Libération',
    url: 'https://www.liberation.fr/checknews/',
    date: '2026-01-01',
    type: 'presse',
  },
  {
    id: 'afp-factuel',
    titre: 'Vérifications factuelles — AFP Factuel',
    editeur: 'Agence France-Presse',
    url: 'https://factuel.afp.com/',
    date: '2026-01-01',
    type: 'presse',
  },
  {
    id: 'programme-officiel',
    titre: 'Programme publié par le candidat',
    editeur: 'Site de campagne',
    url: '',
    date: '2026-01-01',
    type: 'programme',
  },
]

export const sourceById = new Map(sources.map((s) => [s.id, s]))
