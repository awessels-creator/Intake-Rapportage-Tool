interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function EuroInput({ value, onChange, placeholder = '0', className = '' }: Props) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-inkl text-[0.8rem] pointer-events-none select-none">€</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="inp inp-euro"
      />
    </div>
  )
}
