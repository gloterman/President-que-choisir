import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Header } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { MobileNav } from '@/components/layout/MobileNav'
import { PreferencesProvider } from '@/lib/store'
import { FactCheckProvider } from '@/lib/factcheck/store'
import { Home } from '@/pages/Home'
import { Questionnaire } from '@/pages/Questionnaire'
import { Criteria } from '@/pages/Criteria'
import { Ranking } from '@/pages/Ranking'
import { Comparator } from '@/pages/Comparator'
import { Candidates } from '@/pages/Candidates'
import { CandidateSheet } from '@/pages/CandidateSheet'
import { Methodology } from '@/pages/Methodology'
import { Sources } from '@/pages/Sources'
import { Verifications } from '@/pages/Verifications'

/** Remet la vue en haut à chaque changement de route. */
function SiteHeader() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function App() {
  return (
    <PreferencesProvider>
      {/* Les vérifications sont chargées une fois, à l'ouverture du site, et
          partagées par la page dédiée, les fiches et le classement. */}
      <FactCheckProvider>
      <HashRouter>
        <SiteHeader />
        {/* HashRouter possède le hash : laisser ce lien naviguer viderait la route. */}
        <a
          href="#contenu"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('contenu')?.focus()
          }}
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-[var(--pqc-accent-ink)]"
        >
          Aller au contenu
        </a>
        <Header />
        <main id="contenu" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/criteres" element={<Criteria />} />
            <Route path="/classement" element={<Ranking />} />
            <Route path="/comparateur" element={<Comparator />} />
            <Route path="/candidats" element={<Candidates />} />
            <Route path="/candidats/:id" element={<CandidateSheet />} />
            <Route path="/methodologie" element={<Methodology />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/verifications" element={<Verifications />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <SiteFooter />
        <MobileNav />
      </HashRouter>
      </FactCheckProvider>
    </PreferencesProvider>
  )
}
