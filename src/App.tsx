import { FormProvider, useForm } from './context'
import TopBar from './components/TopBar'
import ProgressBar from './components/ProgressBar'
import Changelog from './components/Changelog'
import { HiOutlineInformationCircle } from 'react-icons/hi2'
import Page0Client from './components/pages/Page0Client'
import Page1Persoonlijk from './components/pages/Page1Persoonlijk'
import Page2Crisis from './components/pages/Page2Crisis'
import Page3Vermogen from './components/pages/Page3Vermogen'
import Page4Inkomen from './components/pages/Page4Inkomen'
import Page5Toeslagen from './components/pages/Page5Toeslagen'
import Page6Lasten from './components/pages/Page6Lasten'
import Page7Schulden from './components/pages/Page7Schulden'
import Page8Regelcheck from './components/pages/Page8Regelcheck'
import Page9Advies from './components/pages/Page9Advies'

const PAGES = [
  Page0Client, Page1Persoonlijk, Page2Crisis, Page3Vermogen, Page4Inkomen,
  Page5Toeslagen, Page6Lasten, Page7Schulden, Page8Regelcheck, Page9Advies,
]

function AppInner() {
  const { state, herstelVraag, herstelSessie, negeerHerstel, wissen } = useForm()
  const PageComponent = PAGES[state.currentPage]

  return (
    <div className="min-h-screen bg-paper">
      <TopBar />
      <div className="max-w-[940px] mx-auto px-4 pt-[22px] pb-20">
        <div className="mb-3 rounded border border-rule bg-warm px-3 py-1.5 text-[0.72rem] text-inkl flex items-center justify-between">
          <span>
            <HiOutlineInformationCircle className="inline-block mr-1" />
            Lokale sessie actief op dit apparaat — data blijft op dit apparaat en wordt gewist bij sluiten van het tabblad.
          </span>
          <button type="button" className="ml-3 text-xs text-warn border border-warn-border hover:bg-warns rounded px-2 py-0.5 cursor-pointer" onClick={wissen}>Session wissen</button>
        </div>
        <ProgressBar />
        <PageComponent />
      </div>
      <Changelog />
      {herstelVraag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-paper rounded-lg border border-rule shadow-lg max-w-md w-full p-5">
            <h2 className="text-base font-semibold text-ink mb-2">Niet-afgeronde sessie gevonden</h2>
            <p className="text-sm text-inkl mb-4">
              Er staat een intake op dit apparaat. Wil je deze hervatten of wissen en opnieuw beginnen?
              De sessie is lokaal en verlaat dit apparaat niet.
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" className="text-sm text-warn border border-warn-border hover:bg-warns rounded px-3 py-1.5 cursor-pointer" onClick={negeerHerstel}>Wissen en opnieuw</button>
              <button type="button" className="text-sm text-accent border border-accent/40 hover:bg-accents rounded px-3 py-1.5 cursor-pointer" onClick={herstelSessie}>Hervatten</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <FormProvider>
      <AppInner />
    </FormProvider>
  )
}
