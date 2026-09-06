import { NavLink } from 'react-router-dom'
import { clsx } from '@/lib/format'

const TABS = [
  { to: '/', label: 'Accueil', icon: '⌂', exact: true },
  { to: '/questionnaire', label: 'Répondre', icon: '?' },
  { to: '/classement', label: 'Classement', icon: '≡' },
  { to: '/comparateur', label: 'Comparer', icon: '⇄' },
  { to: '/candidats', label: 'Fiches', icon: '☰' },
]

/** Navigation basse, visible sur les écrans étroits uniquement. */
export function MobileNav() {
  return (
    <nav
      aria-label="Navigation rapide"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.exact}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 py-2 text-[0.65rem] font-medium',
                  isActive ? 'text-accent' : 'text-muted',
                )
              }
            >
              <span aria-hidden="true" className="text-[1rem] leading-none">
                {tab.icon}
              </span>
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
