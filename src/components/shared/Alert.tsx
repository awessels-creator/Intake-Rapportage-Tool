import type { ReactNode } from 'react'

type Variant = 'warn' | 'info' | 'ok' | 'gold' | 'purp'

const cls: Record<Variant, string> = {
  warn: 'bg-warns border border-warn-border text-warn-dark',
  info: 'bg-infos border border-info-border text-info-text',
  ok:   'bg-accents border border-accent-border text-accent-dark',
  gold: 'bg-golds border border-gold-border text-gold-dark',
  purp: 'bg-purps border border-purp-border text-purp-dark',
}

interface Props {
  variant: Variant
  icon?: ReactNode
  title?: string
  children: ReactNode
  className?: string
}

export default function Alert({ variant, icon, title, children, className = '' }: Props) {
  return (
    <div className={`flex gap-[9px] items-start rounded-[7px] px-3 py-[9px] mt-[7px] text-[0.8rem] leading-[1.5] ${cls[variant]} ${className}`}>
      {icon && <span className="text-[1.1rem] shrink-0 mt-px">{icon}</span>}
      <div>
        {title && <strong className="block font-semibold mb-px">{title}</strong>}
        {children}
      </div>
    </div>
  )
}
