import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="no-print mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-[0.9rem] font-semibold text-ink">Président, que choisir&nbsp;?</p>
            <p className="mt-2 max-w-xs text-[0.8rem] leading-relaxed text-ink-2">
              Un outil d’aide à la décision pour l’élection présidentielle française de 2027. Il ne
              recommande personne : il rend explicites vos propres critères et montre ce qu’ils
              impliquent.
            </p>
          </div>
          <div>
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-muted">
              Comprendre
            </p>
            <ul className="mt-3 space-y-1.5 text-[0.82rem]">
              <li>
                <Link to="/methodologie" className="text-ink-2 hover:text-ink hover:underline">
                  Méthodologie et barèmes
                </Link>
              </li>
              <li>
                <Link to="/sources" className="text-ink-2 hover:text-ink hover:underline">
                  Sources et état de vérification
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-muted">
              Vos données
            </p>
            <p className="mt-3 text-[0.8rem] leading-relaxed text-ink-2">
              Vos réponses et vos pondérations restent dans votre navigateur. Aucun compte, aucun
              envoi vers un serveur, aucune mesure d’audience.
            </p>
          </div>
        </div>
        <p className="mt-8 border-t border-line pt-6 text-[0.75rem] leading-relaxed text-muted">
          Les notes produites par cet outil sont des indicateurs construits sur des barèmes publics,
          appliqués à des données perfectibles. Elles ne constituent ni une expertise juridique, ni
          une consigne de vote. Toute personne citée bénéficie de la présomption d’innocence tant
          qu’une condamnation n’est pas définitive.
        </p>
      </div>
    </footer>
  )
}
