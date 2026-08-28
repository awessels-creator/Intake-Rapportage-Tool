import { useForm } from '../context'

const STEPS = [
  'Cliënt', 'Persoonlijk', 'Crisis', 'Vermogen', 'Inkomen',
  'Toeslagen', 'Lasten', 'Schulden', 'Regelcheck', 'Advies',
]

export default function ProgressBar() {
  const { state, goTo } = useForm()
  const cur = state.currentPage

  return (
    <div className="flex mb-[22px] rounded-[7px] overflow-hidden shadow-[0_2px_12px_rgba(26,26,46,.07)]">
      {STEPS.map((label, i) => {
        const isActive = i === cur
        const isDone = i < cur
        return (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={`flex-1 py-[7px] px-0.5 text-center text-[0.56rem] font-medium leading-[1.3] border-r border-rule last:border-r-0 cursor-pointer transition-all duration-200 ${
              isActive
                ? 'bg-accent text-white'
                : isDone
                ? 'bg-ok text-white'
                : 'bg-warm text-inkl'
            }`}
          >
            <span className="block text-[0.52rem] opacity-60 mb-px">{String(i + 1).padStart(2, '0')}</span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
