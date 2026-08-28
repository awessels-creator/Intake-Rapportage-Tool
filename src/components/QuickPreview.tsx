import { useForm } from '../context'
import { buildQuickText } from '../utils'

// Toont de door de snelvragenlijst gegenereerde zinnen boven een bestaand
// open veld, zodat de consulent live ziet wat er al vastligt (optie A).
// Alleen zichtbaar als er daadwerkelijk vinkjes/keuzes zijn voor dit veld.
// De consulent vult aan in de textarea eronder; de preview is alleen-lezen.
export default function QuickPreview({ fieldKey, label }: { fieldKey: string; label?: string }) {
  const { state } = useForm()
  const quick = buildQuickText(state)
  const zinnen = quick[fieldKey] || []
  if (zinnen.length === 0) return null

  return (
    <div className="mb-2 rounded-[6px] border border-accent/30 bg-accents px-3 py-2">
      <div className="text-[0.66rem] font-bold uppercase tracking-wide text-accent-dark mb-1">
        Snelvragenlijst{label ? ` — ${label}` : ''}
      </div>
      <ul className="text-[0.78rem] text-ink space-y-0.5 list-disc list-inside">
        {zinnen.map((z, i) => (
          <li key={i}>{z}</li>
        ))}
      </ul>
    </div>
  )
}
