import { useState } from 'react'
import { useForm } from '../../context'
import { useNormen } from '../../context/NormContext'
import { LASTEN_DEF, PER_OPTIES, TOESLAG_NAMEN, type LastenDef } from '../../constants'
import { getTotaalInkomen, getTotaalLasten, getBeslagTotaal, getBeschikbaarInkomen, getMndBedrag, isJeugdOfInstelling, nl } from '../../utils'
import { downloadBudgetXLSX } from '../../budgetCsv'
import type { LastenWaarde } from '../../types'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import Alert from '../shared/Alert'
import { HiOutlineHome, HiOutlineLightBulb, HiExclamationTriangle, HiXMark, HiArrowLeft, HiArrowRight, HiArrowSmallRight, HiPlus, HiArrowTopRightOnSquare } from 'react-icons/hi2'

interface ExtendedLastenDef extends LastenDef {
  extra?: boolean
  extraIdx?: number
  dierOnly?: boolean
}

export default function Page6Lasten() {
  const { state, set, goTo } = useForm()
  const { NIBUD, BVV_MAX } = useNormen()

  const hA = state.voertuigen.some(v => v.kenteken || v.merk || (parseFloat(v.waarde) || 0) > 0)
  const hD = state.huisdieren === 'ja'
  const hK = state.kinderen === 'ja'
  const ls = state.leefsituatie
  const nibud = NIBUD[ls]
  const ink = getTotaalInkomen(state)
  const beslag = getBeslagTotaal(state)
  const beschikbaar = getBeschikbaarInkomen(state)
  const tot = getTotaalLasten(state)
  const norm = parseFloat(state.bijstandsnorm) || 0
  const best = beschikbaar - tot
  const pct = norm && ink ? (ink / norm) * 100 : 0

  const [inkDetail, setInkDetail] = useState(false)
  const inkDetailRegels: { naam: string; bedrag: number }[] = []
  state.inkomenData.forEach(d => {
    const b = parseFloat(d.netto) || 0
    if (b > 0) inkDetailRegels.push({ naam: d.bron || 'Inkomstenbron', bedrag: b })
  })
  Object.entries(state.toeslagenActief).forEach(([id, actief]) => {
    if (actief) {
      const b = parseFloat((state.toeslagenBedrag as Record<string, string>)[id] || '0') || 0
      if (b > 0) inkDetailRegels.push({ naam: (TOESLAG_NAMEN as Record<string, string>)[id] || id, bedrag: b })
    }
  })
  if (state.alim_ontvangen === 'ja') {
    const ap = parseFloat(state.alim_partner) || 0
    if (ap > 0) inkDetailRegels.push({ naam: 'Partneralimentatie', bedrag: ap })
    const ak = parseFloat(state.alim_kind) || 0
    if (ak > 0) inkDetailRegels.push({ naam: 'Kinderalimentatie', bedrag: ak })
  }

  const allDef: ExtendedLastenDef[] = [
    ...LASTEN_DEF,
    ...state.lastenExtra.map((e, i): ExtendedLastenDef => ({
      id: `extra_${i}`,
      post: e.post || 'Eigen post',
      per: e.per || 'mnd',
      vast: false,
      autoOnly: false,
      kinderOnly: false,
      gblt: false,
      extra: true,
      extraIdx: i,
    })),
  ].filter(row => {
    if (row.autoOnly && !hA) return false
    if (row.dierOnly && !hD) return false
    if (row.kinderOnly && !hK) return false
    return true
  })

  const getW = (id: string, defaultPer: string): LastenWaarde =>
    state.lastenWaarden[id] || { bedrag: '', per: defaultPer, opm: '' }

  const updW = (id: string, patch: Partial<LastenWaarde>, defaultPer: string = 'mnd') => {
    const current = state.lastenWaarden[id] || { bedrag: '', per: defaultPer, opm: '' }
    set({ lastenWaarden: { ...state.lastenWaarden, [id]: { ...current, ...patch } } })
  }

  // Verzekering <-> Lasten consistentie
  const verzConsistentie = (() => {
    const msgs: { variant: 'warn' | 'gold'; icon: React.ReactNode; title: string; msg: string }[] = []
    const twInb = state.tw_inboedel
    const waBdr = parseFloat(getW('wa', 'mnd').bedrag) || 0
    if (twInb === 'nee' && waBdr > 0) msgs.push({ variant: 'warn', icon: <HiExclamationTriangle />, title: 'Tegenstrijdigheid: WA+inboedel', msg: 'Op tabblad Vermogen staat inboedelverzekering op "Nee", maar er is een bedrag ingevuld bij de lasten.' })
    if (twInb === 'ja' && waBdr === 0) msgs.push({ variant: 'gold', icon: <HiOutlineLightBulb />, title: 'WA+inboedel: geen bedrag ingevuld', msg: 'Inboedelverzekering is aanwezig maar er staat geen bedrag bij de lasten. Klopt dit?' })
    const twUitv = state.tw_uitvaart
    const uitvBdr = parseFloat(getW('uitvaart', 'mnd').bedrag) || 0
    if (twUitv === 'nee' && uitvBdr > 0) msgs.push({ variant: 'warn', icon: <HiExclamationTriangle />, title: 'Tegenstrijdigheid: uitvaartverzekering', msg: 'Op tabblad Vermogen staat uitvaartverzekering op "Nee", maar er is een bedrag ingevuld.' })
    if (twUitv === 'ja' && uitvBdr === 0) msgs.push({ variant: 'gold', icon: <HiOutlineLightBulb />, title: 'Uitvaartverzekering: geen bedrag ingevuld', msg: 'Verzekering is aanwezig maar geen lasten ingevuld. Bijv. premie via derden?' })
    return msgs
  })()

  // BVV indicatie: basis = 95% van de bijstandsnorm, begrenst op het inkomen.
  // Opslagen (heffingskorting, kindgebonden budget, woonkosten, zorg) tellen
  // hier niet mee - de volledige berekening loopt via berekenuwrecht.nl.
  const bvv = (() => {
    if (!ink || !norm) return null
    const basisBvv = norm * 0.95
    const bvv_ber = Math.min(basisBvv, ink)
    const maxKey = ls === 'samenwonend' && hK ? 'samenwonend_kind' : ls
    const bvv_max = BVV_MAX[maxKey] || BVV_MAX['alleenstaand']
    const bvv_val = Math.min(bvv_ber, bvv_max)
    const inhoud = ink - bvv_val
    return { bvv_ber, bvv_max, bvv_val, inhoud }
  })()

  return (
    <div>
      <Card icon={<HiOutlineHome />} title="Vaste Lasten Overzicht">
        <p className="text-[0.77rem] text-inkl mb-3">
          Bedrag per week/kwartaal/jaar wordt automatisch omgerekend naar per maand. Gebruik het opmerkingenveld voor bijzonderheden, achterstanden, wie betaalt, kortingen, opzegtermijnen etc.
        </p>

        <div className="overflow-x-auto">
          <table className="ltbl">
            <thead>
              <tr>
                <th style={{ width: 165 }}>Post</th>
                <th style={{ width: 110 }}>Bedrag</th>
                <th style={{ width: 85 }}>Per</th>
                <th style={{ width: 90 }}>
                  <div className="flex items-center gap-0.5">
                    <HiArrowSmallRight />
                    <span>mnd</span>
                  </div>
                </th>
                <th>Opmerking / bijzonderheden</th>
              </tr>
            </thead>
            <tbody>
              {allDef.map(row => {
                const w = getW(row.id, row.per)
                const mnd = w.bedrag ? getMndBedrag(w.bedrag, w.per) : 0
                const nibHint = row.id === 'leef' && nibud ? ` (NIBUD: ±€${nibud}/mnd)` : ''

                return (
                  <tr key={row.id}>
                    <td className="text-[0.77rem] font-medium">
                      {row.post}
                      {row.extra && (
                        <button type="button" className="ml-1.5 text-warn border border-warn-border hover:bg-warns rounded px-1 py-0 text-[0.7rem] cursor-pointer" onClick={() => {
                          const newExtra = state.lastenExtra.filter((_, j) => j !== row.extraIdx)
                          set({ lastenExtra: newExtra })
                        }}><HiXMark /></button>
                      )}
                    </td>
                    <td>
                      <div className="relative" style={{ minWidth: 80 }}>
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-inkl text-[0.73rem] pointer-events-none">€</span>
                        <input
                          type="number"
                          className={`inp ${w.per && w.per !== 'mnd' ? 'border-gold bg-golds' : ''}`}
                          style={{ paddingLeft: 16 }}
                          value={w.bedrag}
                          placeholder="0"
                          onChange={e => updW(row.id, { bedrag: e.target.value }, row.per)}
                        />
                      </div>
                    </td>
                    <td>
                      <select className={`inp ${w.per && w.per !== 'mnd' ? 'border-gold bg-golds' : ''}`} value={w.per} onChange={e => updW(row.id, { per: e.target.value }, row.per)}>
                        {PER_OPTIES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                      </select>
                    </td>
                    <td className="text-[0.72rem] text-inkl whitespace-nowrap">
                      {mnd > 0 ? (
                        <div className="flex items-center gap-1">
                          <HiArrowSmallRight className="opacity-50" />
                          <span>€{mnd.toFixed(2)}/mnd</span>
                        </div>
                      ) : ''}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="inp"
                        value={w.opm}
                        placeholder={row.id === 'leef' ? `Bijv. boodschappen, kleding${nibHint}` : row.gblt ? 'Bijzonderheden | Kwijtschelding: zie Regelcheck' : 'Bijzonderheden, achterstand, wie betaalt...'}
                        onChange={e => updW(row.id, { opm: e.target.value }, row.per)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 mt-2 text-[0.78rem] text-accent border border-accent/40 rounded px-3 py-1 hover:bg-accents cursor-pointer"
          onClick={() => set({ lastenExtra: [...state.lastenExtra, { post: '', per: 'mnd' }] })}
        >
          <HiPlus />
          Eigen post toevoegen
        </button>

        {ink > 0 && (
          <div className="mt-3 p-2.5 bg-warm rounded-lg border border-rule">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[0.88rem]">Totaal inkomen (incl. toeslagen)</span>
              <span className="font-bold text-[0.97rem]">€ {ink.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
            </div>
            <button
              type="button"
              onClick={() => setInkDetail(o => !o)}
              className="mt-1 text-[0.72rem] text-accent font-medium underline decoration-dotted underline-offset-2 hover:text-accent-dark cursor-pointer"
            >
              {inkDetail ? '▾ Verberg wat eronder zit' : '▸ Toon wat eronder zit (Totaal inkomen incl. toeslagen)'}
            </button>
            {inkDetail && (
              <div className="mt-2 rounded border border-rule bg-white p-2">
                <table className="w-full text-[0.73rem]">
                  <thead>
                    <tr className="text-inkl border-b border-rule">
                      <th className="text-left font-normal pb-1">Omschrijving</th>
                      <th className="text-right font-normal pb-1">Bedrag/mnd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inkDetailRegels.length === 0 && (
                      <tr><td colSpan={2} className="py-1 text-inkl italic">Nog geen inkomsten ingevuld.</td></tr>
                    )}
                    {inkDetailRegels.map((r, i) => (
                      <tr key={i}>
                        <td className="py-0.5">{r.naam}</td>
                        <td className="py-0.5 text-right">€ {nl(r.bedrag, 2)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-rule font-semibold">
                      <td className="py-0.5">Som</td>
                      <td className="py-0.5 text-right">€ {nl(ink, 2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {beslag > 0 && (
              <div className="flex justify-between items-center mt-2 text-warn-dark">
                <span className="font-semibold text-[0.84rem]">Beslag op inkomen (−)</span>
                <span className="font-bold text-[0.92rem]">− € {beslag.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-1 border-t border-rule pt-1.5">
              <span className="font-semibold text-[0.86rem]">Beschikbaar inkomen</span>
              <span className="font-bold text-[0.95rem] text-accent-dark">€ {beschikbaar.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        <div className={`flex justify-between items-center ${ink > 0 ? 'mt-1' : 'mt-3'} p-2.5 bg-warm rounded-lg border border-rule`}>
          <span className="font-semibold text-[0.88rem]">Totaal vaste lasten / maand</span>
          <span className="font-bold text-[0.97rem]">€ {tot.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
        </div>

        {ink > 0 && tot > 0 && (
          <>
            <div className="border-t border-rule mt-1"></div>
            <div className={`flex justify-between items-center mt-1 p-2.5 rounded-lg border ${best < 0 ? 'bg-warns border-warn-border' : 'bg-accents border-accent-border'}`}>
              <span className="font-semibold text-[0.88rem]">Besteedbaar (inkomen − beslag − lasten)</span>
              <span className={`font-bold text-[0.97rem] ${best < 0 ? 'text-warn-dark' : 'text-accent-dark'}`}>
                € {best.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}

        {pct > 0 && pct < 120 && (
          <Alert variant="ok" icon={<HiOutlineLightBulb />} title="Kwijtschelding mogelijk — inkomen <120% norm" className="mt-2">
            Controleer bij Regelcheck of kwijtschelding GBLT + gemeentelijke belastingen is aangevraagd/gehonoreerd.
          </Alert>
        )}


        {verzConsistentie.map((s, i) => <Alert key={i} variant={s.variant} icon={s.icon} title={s.title} className="mt-2">{s.msg}</Alert>)}

        <button
          type="button"
          className="flex items-center gap-1.5 mt-3 text-[0.78rem] text-accent border border-accent/40 rounded px-3 py-1 hover:bg-accents cursor-pointer"
          onClick={() => downloadBudgetXLSX(state)}
        >
          <HiOutlineHome /> Exporteer budgetoverzicht (voor inwoner, .xlsx)
        </button>
      </Card>

      {isJeugdOfInstelling(ls) ? (
        <div className="bg-white rounded-xl border border-warn-border shadow-sm p-4 mb-4">
          <Alert variant="warn" icon={<HiExclamationTriangle />} title="Beslagvrije voet niet geautomatiseerd">
            Bij een jeugdige &lt;21 of verblijf in een instelling geldt een verlaagde norm (kostendelersnorm / zak- en kleedgeldnorm). De tool berekent de beslagvrije voet hier niet zelf uit. Controleer de beslagvrije voet altijd via berekenuwrecht.nl aan de hand van de ingevulde (verlaagde) norm en de feitelijke woonsituatie.
          </Alert>
          <a
            href="https://www.berekenuwrecht.nl/beslagvrije-voet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-accent text-white text-[0.78rem] font-medium hover:opacity-90"
          >
            <HiArrowTopRightOnSquare className="inline-block" /> Controleer de beslagvrije voet via berekenuwrecht.nl
          </a>
        </div>
      ) : bvv && (
        <div className="bg-white rounded-xl border border-rule shadow-sm p-4 mb-4">
          <div className="font-semibold text-[0.9rem] text-accent mb-3">Beslagvrije Voet (indicatie basis, jul 2026)</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Berekende BVV', value: bvv.bvv_ber },
              { label: 'Wettelijk maximum', value: bvv.bvv_max },
              { label: 'Toe te passen BVV', value: bvv.bvv_val },
              { label: 'Max. voor beslag beschikbaar', value: bvv.inhoud, colored: true },
            ].map(item => (
              <div key={item.label} className="bg-warm rounded-lg p-2.5 border border-rule">
                <div className="text-[0.7rem] text-inkl mb-1">{item.label}</div>
                <div className={`font-bold text-[0.9rem] ${item.colored ? (bvv.inhoud > 0 ? 'text-accent' : 'text-warn') : 'text-ink'}`}>
                  € {item.value.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[0.7rem] text-inkl mt-2">
            Dit is de basis-beslagvrije voet: 95% van de bijstandsnorm, begrenst op het inkomen. Opslagen zoals heffingskorting, kindgebonden budget en woonkosten zijn niet meegeteld.
          </div>
          <a
            href="https://www.berekenuwrecht.nl/beslagvrije-voet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-accent text-white text-[0.78rem] font-medium hover:opacity-90"
          >
            <HiArrowTopRightOnSquare className="inline-block" /> Controleer de volledige beslagvrije voet via berekenuwrecht.nl
          </a>
        </div>
      )}

      <NavRow
        onBack={() => goTo(5)}
        backLabel={<><HiArrowLeft className="inline-block mr-1" /> Toeslagen</>}
        onNext={() => goTo(7)}
        nextLabel={<>Schulden <HiArrowRight className="inline-block ml-1" /></>}
      />
    </div>
  )
}
