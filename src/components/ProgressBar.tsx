import { useForm } from '../context'
import { tabStatus } from '../utils'

const STEPS = [
  'Cliënt', 'Persoonlijk', 'Crisis', 'Vermogen', 'Inkomen',
  'Toeslagen', 'Lasten', 'Schulden', 'Regelcheck', 'Advies',
]

// Kleur van de status-dot per tabblad-status
const DOT: Record<'open' | 'ok' | 'nvt', string> = {
  open: 'bg-warn',   // oranje: nog invullen
  ok: 'bg-ok',       // groen: ingevuld
  nvt: 'bg-inkl/40', // grijs: niet van toepassing
}
const TITEL: Record<'open' | 'ok' | 'nvt', string> = {
  open: 'Nog invullen',
  ok: 'Ingevuld',
  nvt: 'Niet van toepassing',
}

export default function ProgressBar() {
  const { state, goTo } = useForm()
  const cur = state.currentPage

  return (
    <div className="flex mb-[22px] rounded-[7px] overflow-hidden shadow-[0_2px_12px_rgba(26,26,46,.07)]">
      {STEPS.map((label, i) => {
        const isActive = i === cur
        const status = tabStatus(state, i)
        return (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            title={`${label}: ${TITEL[status]}`}
            className={`flex-1 py-[7px] px-0.5 text-center text-[0.56rem] font-medium leading-[1.3] border-r border-rule last:border-r-0 cursor-pointer transition-all duration-200 ${
              isActive
                ? 'bg-accent text-white'
                : status === 'ok'
                ? 'bg-warm text-inkl'
                : status === 'nvt'
                ? 'bg-warm text-inkl/60'
                : 'bg-warns text-inkl'
            }`}
          >
            <span className="block text-[0.52rem] opacity-60 mb-px">{String(i + 1).padStart(2, '0')}</span>
            {label}
            <span className={`block mx-auto mt-1 w-2 h-2 rounded-full ${DOT[status]}`}></span>
          </button>
        )
      })}
    </div>
  )
}
