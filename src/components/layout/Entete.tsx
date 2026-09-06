import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { clsx } from '@/lib/format'
import { usePreferences, useTheme } from '@/lib/store'

const LINKS = [
  { to: '/questionnaire', label: 'Questionnaire' },
  { to: '/criteres', label: 'Critères' },
  { to: '/classement', label: 'Classement' },
  { to: '/comparateur', label: 'Comparateur' },
  { to: '/candidats', label: 'Candidats' },
  { to: '/verifications', label: 'Vérifications' },
]

const SECONDARY_LINKS = [
  { to: '/methodologie', label: 'Méthodologie' },
  { to: '/sources', label: 'Sources' },
]

export function Header() {
  const { progress } = usePreferences()
  const [theme, setTheme] = useTheme()
  const [menuOuvert, setMenuOuvert] = useState(false)

  const nextTheme = theme === 'sombre' ? 'clair' : 'sombre'

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-[0.8rem] font-bold text-[var(--pqc-accent-ink)]"
          >
            P
          </span>
          <span className="text-[0.9rem] font-semibold tracking-tight text-ink">
            Président, que choisir&nbsp;?
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="ml-auto hidden items-center gap-0.5 lg:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-2.5 py-1.5 text-[0.82rem] font-medium transition-colors',
                  isActive ? 'bg-accent-soft text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <span aria-hidden="true" className="mx-1.5 h-4 w-px bg-line" />
          {SECONDARY_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-2.5 py-1.5 text-[0.82rem] transition-colors',
                  isActive ? 'text-ink' : 'text-muted hover:text-ink',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-[0.85rem] text-ink-2 hover:bg-surface-2 lg:ml-2"
          aria-label={`Passer en thème ${nextTheme}`}
          title={`Passer en thème ${nextTheme}`}
        >
          <span aria-hidden="true">{theme === 'sombre' ? '☀' : '☾'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMenuOuvert((o) => !o)}
          aria-expanded={menuOuvert}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-ink-2 hover:bg-surface-2 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <span aria-hidden="true">{menuOuvert ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Progression du questionnaire : la seule barre persistante de l'interface. */}
      <div className="h-0.5 w-full bg-transparent">
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progression du questionnaire"
        />
      </div>

      {menuOuvert && (
        <nav
          aria-label="Navigation mobile"
          className="border-t border-line bg-surface px-4 py-2 lg:hidden"
        >
          {[...LINKS, ...SECONDARY_LINKS].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOuvert(false)}
              className={({ isActive }) =>
                clsx(
                  'block rounded-lg px-3 py-2.5 text-[0.88rem] font-medium',
                  isActive ? 'bg-accent-soft text-ink' : 'text-ink-2',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
