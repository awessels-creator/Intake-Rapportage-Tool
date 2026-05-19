interface Option { value: string; label: string }

interface Props {
  value: string
  options: Option[]
  onChange: (val: string) => void
}

export default function RadioGroup({ value, options, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-[6px] mt-[3px]">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-[5px] px-[10px] py-[5px] rounded-[6px] text-[0.8rem] border-[1.5px] transition-colors cursor-pointer ${
            value === opt.value
              ? 'bg-accent text-white border-accent'
              : 'bg-white text-ink border-rule hover:border-accent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
