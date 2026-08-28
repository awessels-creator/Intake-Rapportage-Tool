import type { ReactNode } from 'react'

interface Props {
  onBack?: () => void
  backLabel?: ReactNode
  onNext: () => void
  nextLabel: ReactNode
  nextVariant?: 'green' | 'blue' | 'ok'
}

export default function NavRow({ onBack, backLabel, onNext, nextLabel, nextVariant = 'green' }: Props) {
  return (
    <div className="flex justify-between items-center mt-[18px]">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 rounded-[7px] text-[0.85rem] font-semibold border-[1.5px] border-rule bg-warm text-inkl hover:bg-rule transition-all duration-150 cursor-pointer"
        >
          {backLabel || 'Vorige'}
        </button>
      ) : (
        <div />
      )}
      <button
        type="button"
        onClick={onNext}
        className={`px-5 py-2 rounded-[7px] text-[0.85rem] font-semibold text-white transition-all duration-150 cursor-pointer ${
          nextVariant === 'blue'
            ? 'bg-info hover:bg-info-dark'
            : nextVariant === 'ok'
            ? 'bg-ok hover:bg-ok-dark'
            : 'bg-accent hover:bg-accent-dark'
        }`}
      >
        {nextLabel}
      </button>
    </div>
  )
}
