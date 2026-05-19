import { useForm } from '../context'
import { downloadWord } from '../download'
import { HiArrowPath, HiArrowDownTray } from 'react-icons/hi2'

export default function TopBar() {
  const { state, resetForm } = useForm()

  return (
    <div className="sticky top-0 z-200 flex items-center justify-between px-[22px] py-[10px] bg-accent text-white">
      {/* version: 2.0.1 */}
      <div className="flex items-center gap-[10px]">
        <div className="font-semibold text-[1.1rem]">Intakerapportage</div>
        <div className="text-[0.7rem] text-white/60">2026</div>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={resetForm}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-[0.77rem] font-medium rounded-md border border-white/30 text-white/80 bg-transparent hover:bg-white/10 transition-all duration-150 cursor-pointer"
        >
          <HiArrowPath className="text-[0.9rem]" />
          Nieuw
        </button>
        <button
          type="button"
          onClick={() => downloadWord(state)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-[0.77rem] font-medium rounded-md bg-ok text-white hover:bg-ok-dark transition-all duration-150 cursor-pointer"
        >
          <HiArrowDownTray className="text-[0.9rem]" />
          Rapport (.doc)
        </button>
      </div>
    </div>
  )
}
