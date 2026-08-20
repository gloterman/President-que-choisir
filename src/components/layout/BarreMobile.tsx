import { NavLink } from 'react-router-dom'
import { clsx } from '@/lib/format'

const ONGLETS = [
  { to: '/', label: 'Accueil', icone: '⌂', exact: true },
  { to: '/questionnaire', label: 'Répondre', icone: '?' },
  { to: '/classement', label: 'Classement', icone: '≡' },
  { to: '/comparateur', label: 'Comparer', icone: '⇄' },
  { to: '/candidats', label: 'Fiches', icone: '☰' },
]

/** Navigation basse, visible sur les écrans étroits uniquement. */
export function BarreMobile() {
  return (
    <nav
      aria-label="Navigation rapide"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <ul className="grid grid-cols-5">
        {ONGLETS.map((onglet) => (
          <li key={onglet.to}>
            <NavLink
              to={onglet.to}
              end={onglet.exact}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 py-2 text-[0.65rem] font-medium',
                  isActive ? 'text-accent' : 'text-muted',
                )
              }
            >
              <span aria-hidden="true" className="text-[1rem] leading-none">
                {onglet.icone}
              </span>
              {onglet.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
