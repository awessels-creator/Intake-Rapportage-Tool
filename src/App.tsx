import { FormProvider, useForm } from './context'
import TopBar from './components/TopBar'
import ProgressBar from './components/ProgressBar'
import Changelog from './components/Changelog'
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
  const { state } = useForm()
  const PageComponent = PAGES[state.currentPage]

  return (
    <div className="min-h-screen bg-paper">
      <TopBar />
      <div className="max-w-[940px] mx-auto px-4 pt-[22px] pb-20">
        <ProgressBar />
        <PageComponent />
      </div>
      <Changelog />
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
