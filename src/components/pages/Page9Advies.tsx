import { useState } from 'react'
import { useForm } from '../../context'
import { getTotaalInkomen, getTotaalLasten, nl } from '../../utils'
import type { AdviesItem } from '../../types'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import { downloadWord } from '../../download'
import { HiOutlineClipboardDocumentList, HiOutlineCheckCircle, HiOutlinePencilSquare, HiPencilSquare, HiArrowLeft, HiArrowDownTray, HiPlus } from 'react-icons/hi2'

const L = 'block text-[.76rem] text-inkl mb-0.5 font-medium'
const row2 = 'grid grid-cols-2 gap-3 mb-3'

const pCls: Record<string, string> = {
  urg: 'border-l-4 border-warn bg-warns',
  med: 'border-l-4 border-gold bg-golds',
  low: 'border-l-4 border-accent bg-accents',
}

function AdviesCard({ item, idx, onToggle, onEdit, onEditTitle }: {
  item: AdviesItem; idx: number
  onToggle: (i: number) => void
  onEdit: (i: number, text: string) => void
  onEditTitle?: (i: number, title: string) => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div className={`rounded-lg px-4 py-3 mb-2 ${item.on ? pCls[item.p] : 'border border-rule bg-warm opacity-60'}`}>
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={item.on}
          className="mt-0.5 accent-accent w-3.5 h-3.5 shrink-0"
          onChange={() => onToggle(idx)}
        />
        <div className="flex-1 min-w-0">
          {item.custom && onEditTitle ? (
            <input
              className="inp font-semibold text-[0.82rem] mb-1"
              value={item.t}
              placeholder="Naam actiepunt (bijv. Toeslag UWV aanvragen)"
              onChange={e => onEditTitle(idx, e.target.value)}
            />
          ) : (
            <div className="font-semibold text-[0.82rem]">{item.t}</div>
          )}
          {!editing && <div className="text-[0.77rem] mt-0.5 text-inkl">{item.b}</div>}
          {editing && (
            <textarea
              className="inp mt-1 text-[0.77rem]"
              rows={2}
              defaultValue={item.b}
              onBlur={e => { onEdit(idx, e.target.value); setEditing(false) }}
              autoFocus
            />
          )}
        </div>
        <button type="button" className="text-[1rem] text-inkl hover:text-ink shrink-0 cursor-pointer" onClick={() => setEditing(!editing)}>
          <HiPencilSquare />
        </button>
      </div>
    </div>
  )
}

export default function Page9Advies() {
  const { state, set, goTo } = useForm()

  const ink = getTotaalInkomen(state)
  const tot = getTotaalLasten(state)
  const best = ink - tot
  const norm = parseFloat(state.bijstandsnorm) || 0
  const pct = norm && ink ? (ink / norm) * 100 : 0
  const schulden = state.schuldenData.reduce((s, d) => s + (parseFloat(d.b) || 0), 0)
  const naam = `${state.voornaam} ${state.achternaam}`.trim() || '—'

  const toggleAdv = (i: number) => {
    set({ advItems: state.advItems.map((a, j) => j === i ? { ...a, on: !a.on } : a) })
  }

  const editAdv = (i: number, text: string) => {
    set({ advItems: state.advItems.map((a, j) => j === i ? { ...a, b: text } : a) })
  }

  const editAdvTitle = (i: number, title: string) => {
    set({ advItems: state.advItems.map((a, j) => j === i ? { ...a, t: title } : a) })
  }

  const addCustom = () => {
    const newItem: AdviesItem = { p: 'low', t: '', b: '', on: true, custom: true }
    set({ advItems: [...state.advItems, newItem] })
  }

  const cbItems: { key: keyof typeof state; label: string }[] = [
    { key: 'cb_budgetbeheer', label: 'Budgetbeheer' },
    { key: 'cb_schuldregeling', label: 'Schuldregeling' },
    { key: 'cb_bewind_medisch', label: 'Beschermingsbewind — medische gronden' },
    { key: 'cb_bewind_schuld', label: 'Beschermingsbewind — schuldenbewind' },
    { key: 'cb_schuldhulpmaatje', label: 'Schuldhulpmaatje / Humanitas' },
    { key: 'cb_overig_aanvr', label: 'Overige doorverwijzing' },
  ]

  return (
    <div>
      {/* Summary */}
      <div className="bg-white rounded-xl border border-rule shadow-sm p-4 mb-4">
        <div className="font-semibold text-[0.97rem] text-ok mb-3">Samenvatting Intake</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Cliënt', value: naam },
            { label: 'Inkomen', value: `€ ${nl(ink)}/mnd` },
            { label: 'Niveau norm', value: pct > 0 ? pct.toFixed(0) + '%' : '—' },
            { label: 'Vaste lasten', value: `€ ${nl(tot)}/mnd` },
            { label: 'Besteedbaar', value: `€ ${nl(best)}/mnd`, colored: true },
            { label: 'Totaal schulden', value: `€ ${nl(schulden)}` },
          ].map(item => (
            <div key={item.label} className="bg-warm rounded-lg p-2.5 border border-rule">
              <div className="text-[0.7rem] text-inkl">{item.label}</div>
              <div className={`font-semibold text-[0.88rem] mt-0.5 ${item.colored ? best < 0 ? 'text-warn' : 'text-ok' : 'text-ink'}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card icon={<HiOutlineClipboardDocumentList />} title="Aanvraag & Type dienstverlening">
        <div className="text-[0.67rem] font-semibold text-inkl uppercase tracking-widest mb-2 pb-1 border-b border-rule">Aanvraag voor — definitieve selectie</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {cbItems.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 p-2 rounded border border-rule cursor-pointer hover:bg-warm text-[0.79rem]">
              <input
                type="checkbox"
                checked={state[key] as boolean}
                className="accent-accent w-3.5 h-3.5"
                onChange={e => set({ [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>
        {state.cb_overig_aanvr && (
          <div>
            <label className={L}>Overige doorverwijzing — omschrijving</label>
            <input className="inp" value={state.overig_aanvr_txt} onChange={e => set({ overig_aanvr_txt: e.target.value })}
              placeholder="Bijv. schuldhulpverlening gemeente X / maatschappelijk werk..." />
          </div>
        )}
      </Card>

      <Card icon={<HiOutlineCheckCircle />} title="Adviezen & Actiepunten">
        <p className="text-[0.77rem] text-inkl mb-3">Vink aan welke adviezen van toepassing zijn. Klik op het icoon om tekst te bewerken.</p>
        {state.advItems.map((item, i) => (
          <AdviesCard key={i} item={item} idx={i} onToggle={toggleAdv} onEdit={editAdv} onEditTitle={editAdvTitle} />
        ))}
        <button
          type="button"
          className="flex items-center gap-1.5 mt-1 text-[0.78rem] text-accent border border-accent/40 rounded px-3 py-1 hover:bg-accents cursor-pointer"
          onClick={addCustom}
        >
          <HiPlus />
          Eigen actiepunt toevoegen
        </button>
      </Card>

      <Card icon={<HiOutlinePencilSquare />} title="Conclusie & Vervolgstappen">
        <div className="mb-3">
          <label className={L}>Conclusie / toelichting en motivatie cliënt / afspraken</label>
          <textarea className="inp" rows={4} value={state.conclusie}
            onChange={e => set({ conclusie: e.target.value })}
            placeholder="Conclusie, gemaakte afspraken, vervolgstappen..." />
        </div>
        <div className={row2}>
          <div>
            <label className={L}>Naam medewerker / consulent</label>
            <input className="inp" value={state.naam_consulent2} onChange={e => set({ naam_consulent2: e.target.value })} placeholder="Naam consulent geldzorgen" />
          </div>
          <div>
            <label className={L}>Datum rapportage</label>
            <input type="date" className="inp" value={state.datum_rapportage} onChange={e => set({ datum_rapportage: e.target.value })} />
          </div>
        </div>
      </Card>

      <NavRow
        onBack={() => goTo(8)}
        backLabel={<><HiArrowLeft className="inline-block mr-1" /> Regelcheck</>}
        onNext={() => downloadWord(state)}
        nextLabel={<><HiArrowDownTray className="inline-block mr-1" /> Rapport downloaden (.doc)</>}
        nextVariant="ok"
      />
    </div>
  )
}
