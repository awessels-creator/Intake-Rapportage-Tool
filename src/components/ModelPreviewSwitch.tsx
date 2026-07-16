import { useEffect, useState } from 'react'
import {
  getBeschikbareModellen, setNormPreview, clearNormPreview, getActivePeriode,
} from '../constants'

// Luistert naar de 'norm-preview-change' event die constants.ts dispatches
// wanneer de actieve normenset wisselt (preview aan/uit).
function useActiveModel(): string {
  const [m, setM] = useState(() => getActivePeriode().model)
  useEffect(() => {
    const on = () => setM(getActivePeriode().model)
    document.addEventListener('norm-preview-change', on)
    return () => document.removeEventListener('norm-preview-change', on)
  }, [])
  return m
}

export default function ModelPreviewSwitch() {
  const active = useActiveModel()
  const opts = getBeschikbareModellen()
  const liveModel = opts[opts.length - 1].model
  const isPreview = active !== liveModel

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.68rem] font-medium ${
        isPreview ? 'bg-gold text-ink' : 'bg-white/15 text-white/90'
      }`}
      title="Toekomstige normen alvast bekijken (preview). Bij een echte intake staat dit op het actuele model."
    >
      <span className="opacity-70">model</span>
      <span className="font-semibold">{active}</span>
      <select
        aria-label="Model preview"
        value={active}
        onChange={e => (e.target.value === liveModel ? clearNormPreview() : setNormPreview(e.target.value))}
        className={`ml-0.5 rounded px-1 py-0.5 text-[0.68rem] font-semibold border cursor-pointer ${
          isPreview ? 'bg-gold text-ink border-gold-dark' : 'bg-white/20 text-white border-white/30'
        }`}
      >
        {opts.map(p => (
          <option key={p.model} value={p.model}>
            {p.model} — {p.label}
          </option>
        ))}
      </select>
      {isPreview && (
        <button
          type="button"
          onClick={clearNormPreview}
          className="ml-0.5 text-[0.6rem] underline opacity-80 hover:opacity-100 cursor-pointer"
          title="Preview uitzetten en terug naar actuele model"
        >
          live
        </button>
      )}
    </div>
  )
}
