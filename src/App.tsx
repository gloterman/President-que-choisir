import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Entete } from '@/components/layout/Entete'
import { PiedDePage } from '@/components/layout/PiedDePage'
import { BarreMobile } from '@/components/layout/BarreMobile'
import { FournisseurPreferences } from '@/lib/store'
import { Accueil } from '@/pages/Accueil'
import { Questionnaire } from '@/pages/Questionnaire'
import { Criteres } from '@/pages/Criteres'
import { Classement } from '@/pages/Classement'
import { Comparateur } from '@/pages/Comparateur'
import { Candidats } from '@/pages/Candidats'
import { FicheCandidat } from '@/pages/FicheCandidat'
import { Methodologie } from '@/pages/Methodologie'
import { Sources } from '@/pages/Sources'

/** Remet la vue en haut à chaque changement de route. */
function HautDePage() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export function App() {
  return (
    <FournisseurPreferences>
      <HashRouter>
        <HautDePage />
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-[var(--pqc-accent-ink)]"
        >
          Aller au contenu
        </a>
        <Entete />
        <main id="contenu" className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pb-12">
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/criteres" element={<Criteres />} />
            <Route path="/classement" element={<Classement />} />
            <Route path="/comparateur" element={<Comparateur />} />
            <Route path="/candidats" element={<Candidats />} />
            <Route path="/candidats/:id" element={<FicheCandidat />} />
            <Route path="/methodologie" element={<Methodologie />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="*" element={<Accueil />} />
          </Routes>
        </main>
        <PiedDePage />
        <BarreMobile />
      </HashRouter>
    </FournisseurPreferences>
  )
}
