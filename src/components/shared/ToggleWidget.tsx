interface Option { v: string; l: React.ReactNode }

interface Props {
  value: string
  options: Option[]
  onChange: (v: string) => void
}

const activeCls: Record<string, string> = {
  ja:      'bg-accents text-accent-dark border-accent-border font-semibold',
  nee:     'bg-warns text-warn-dark border-warn-border font-semibold',
  aanvr:   'bg-golds text-gold-dark border-gold-border font-semibold',
  nvt:     'bg-warm text-inkl border-rule font-semibold',
  behoud:  'bg-accents text-accent-dark border-accent-border font-semibold',
  verkoop: 'bg-warns text-warn-dark border-warn-border font-semibold',
  nvb:     'bg-warm text-inkl border-rule font-semibold',
}

export default function ToggleWidget({ value, options, onChange }: Props) {
  return (
    <div className="flex gap-1 mt-[3px] flex-wrap">
      {options.map(opt => (
        <button
          key={opt.v}
          type="button"
          onClick={() => onChange(opt.v)}
          className={`px-[9px] py-1 rounded-[5px] text-[0.76rem] border-[1.5px] transition-colors cursor-pointer ${
            value === opt.v
              ? activeCls[opt.v] || 'bg-accent text-white border-accent font-semibold'
              : 'bg-white text-inkl border-rule hover:border-accent'
          }`}
        >
          {opt.l}
        </button>
      ))}
    </div>
  )
}
