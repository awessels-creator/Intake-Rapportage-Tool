import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  children: ReactNode
}

export default function Card({ icon, title, children }: Props) {
  return (
    <div className="bg-white rounded-[10px] shadow-[0_2px_12px_rgba(26,26,46,.07)] mb-4 overflow-hidden">
      <div className="flex items-center gap-[9px] px-[18px] py-[12px] border-b border-rule bg-warm">
        <span className="w-[28px] h-[28px] rounded-[6px] bg-accent text-white flex items-center justify-center text-[1.1rem] shrink-0">
          {icon}
        </span>
        <span className="text-[0.98rem] font-semibold text-ink">{title}</span>
      </div>
      <div className="px-[18px] py-[16px]">{children}</div>
    </div>
  )
}
