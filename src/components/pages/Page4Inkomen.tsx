import { useForm } from '../../context'
import { NORM } from '../../constants'
import { getTotaalInkomen, nl, updArr, rmArr, mkInk, mkBeslag, yearsSince } from '../../utils'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import RadioGroup from '../shared/RadioGroup'
import EuroInput from '../shared/EuroInput'
import Alert from '../shared/Alert'
import { HiExclamationTriangle, HiOutlineClock, HiOutlineInformationCircle, HiOutlineBuildingLibrary, HiXMark, HiArrowLeft, HiArrowRight, HiPlus, HiCheckCircle } from 'react-icons/hi2'
import { BsCashStack } from 'react-icons/bs'

const L = 'block text-[.76rem] text-inkl mb-0.5 font-medium'
const SL = 'text-[0.67rem] font-semibold text-inkl uppercase tracking-widest mb-2 pb-1 border-b border-rule'
const row2 = 'grid grid-cols-2 gap-3 mb-3'
const row3 = 'grid grid-cols-3 gap-3 mb-3'

export default function Page4Inkomen() {
  const { state, set, goTo } = useForm()

  const norm = parseFloat(state.bijstandsnorm) || 0
  const ink = getTotaalInkomen(state)
  const pct = norm && ink ? (ink / norm) * 100 : 0
  const isPensioen = state.leefsituatie.startsWith('pensioen')
  const heeftBeslag = state.inkomenData.some(d => d.beslag)

  const badgeColor = pct < 100 ? 'var(--color-warn-dark)' : pct < 105 ? 'var(--color-ok-dark)' : pct < 120 ? 'var(--color-gold-dark)' : 'var(--color-info-text)'
  const badgeBg = pct < 100 ? 'var(--color-warns)' : pct < 105 ? 'var(--color-oks)' : pct < 120 ? 'var(--color-golds)' : 'var(--color-infos)'

  const iitDuur = yearsSince(state.iit_datum)

  return (
    <div>
      <Card icon={<BsCashStack />} title="Inkomen">
        <div className="bg-warm border border-rule rounded-lg p-3 text-[0.77rem] mb-3">
          <strong className="text-[0.79rem]">Bijstandsnormen 1 januari 2026 (netto excl. vakantietoeslag)</strong>
          <table className="w-full mt-1 text-[0.76rem]">
            <tbody>
              <tr><td className="text-inkl py-0.5 pr-2">Alleenstaande / Alleenstaande ouder (21+)</td><td className="font-semibold">€ 1.331,42/mnd</td></tr>
              <tr><td className="text-inkl py-0.5 pr-2">Samenwonend / Gehuwd</td><td className="font-semibold">€ 1.902,09/mnd</td></tr>
              <tr><td className="text-inkl py-0.5 pr-2">Pensioengerechtigde — alleenstaand (AIO SVB)</td><td className="font-semibold">€ 1.430,29/mnd</td></tr>
              <tr><td className="text-inkl py-0.5 pr-2">Pensioengerechtigde — beiden AOW-gerechtigd</td><td className="font-semibold">€ 2.041,11/mnd</td></tr>
            </tbody>
          </table>
        </div>

        <div className={row2}>
          <div>
            <label className={L}>Bijstandsnorm (netto/mnd)</label>
            <EuroInput value={state.bijstandsnorm} onChange={v => set({ bijstandsnorm: v })} placeholder="1401.50" />
            {state.leefsituatie && NORM[state.leefsituatie] && (
              <div className="text-[0.7rem] text-accent mt-0.5">Auto-ingevuld: €{NORM[state.leefsituatie].toLocaleString('nl-NL')} excl. vakantietoeslag (aanpasbaar)</div>
            )}
          </div>
          <div>
            {norm > 0 && ink > 0 && (
              <div className="mt-5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.7rem] font-semibold" style={{ background: badgeBg, color: badgeColor }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  {pct.toFixed(1)}% van bijstandsnorm (€{nl(norm)})
                </span>
              </div>
            )}
          </div>
        </div>

        {norm > 0 && ink > 0 && (
          <div className="mb-3">
            {pct < 100 && <Alert variant="warn" icon={<HiExclamationTriangle />} title="Inkomen onder bijstandsniveau">€{ink.toFixed(0)} &lt; norm €{norm.toFixed(0)}. Aanvullende bijstand/AIO aanvragen.</Alert>}
            {pct >= 100 && pct < 105 && !isPensioen && <Alert variant="gold" icon={<HiOutlineClock />} title="IIT — tijdsduur controleren">Na 3 jaar ≤105% norm kan IIT worden aangevraagd.</Alert>}
            {pct < 110 && !isPensioen && <Alert variant="info" icon={<HiOutlineInformationCircle />} title="FDMA — inkomen &lt;110% norm">Controleer bij Regelcheck.</Alert>}
            {pct < 120 && <Alert variant="ok" icon={<HiOutlineBuildingLibrary />} title="Kwijtschelding mogelijk — &lt;120% norm">Controleer bij Vaste Lasten en Regelcheck.</Alert>}
          </div>
        )}

        <hr className="border-rule my-3" />
        <div className={SL}>Inkomstenbronnen</div>
        <p className="text-[0.77rem] text-inkl mb-2">Meerdere bronnen mogelijk — voeg toe indien cliënt meerdere werkgevers / uitkeringen heeft.</p>

        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Bron / Werkgever / Instantie</th><th>Type inkomen</th><th>Invoer per</th><th>Netto/mnd</th><th>Dienstverband / uren</th><th>Beslag?</th><th></th></tr></thead>
            <tbody>
              {state.inkomenData.map((d, i) => {
                const berekenMnd = (): number => {
                  if (d.invoerPer === 'mnd') return parseFloat(d.netto) || 0
                  const week = parseFloat(d.weekBedrag) || 0
                  return (d.inclVak ? week / 1.08 : week) * 52 / 12
                }
                const mndBedrag = berekenMnd()
                return (
                <tr key={i}>
                  <td><input className="inp" value={d.bron} placeholder="Naam werkgever / instantie" onChange={e => set({ inkomenData: updArr(state.inkomenData, i, { bron: e.target.value }) })} /></td>
                  <td>
                    <select className="inp" value={d.type} onChange={e => set({ inkomenData: updArr(state.inkomenData, i, { type: e.target.value }) })}>
                      <option value="">—</option>
                      <option value="loon">Loon/salaris</option>
                      <option value="bijstand">Bijstand (PW)</option>
                      <option value="aow">AOW/pensioen</option>
                      <option value="aio">AIO (SVB)</option>
                      <option value="ww">WW-uitkering</option>
                      <option value="wia">WIA/WAO</option>
                      <option value="zzp">ZZP/ondernemer</option>
                      <option value="anders">Anders</option>
                    </select>
                  </td>
                  <td style={{ minWidth: 80 }}>
                    <select className="inp" value={d.invoerPer} onChange={e => set({ inkomenData: updArr(state.inkomenData, i, { invoerPer: e.target.value as 'mnd' | 'week' }) })}>
                      <option value="mnd">Per maand</option>
                      <option value="week">Per week</option>
                    </select>
                  </td>
                  <td>
                    {d.invoerPer === 'mnd' ? (
                      <div className="relative" style={{ minWidth: 90 }}>
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-inkl text-[0.76rem] pointer-events-none">€</span>
                        <input type="number" className="inp" style={{ paddingLeft: 16 }} value={d.netto} placeholder="0" onChange={e => set({ inkomenData: updArr(state.inkomenData, i, { netto: e.target.value }) })} />
                      </div>
                    ) : (
                      <div>
                        <div className="relative" style={{ minWidth: 90 }}>
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-inkl text-[0.76rem] pointer-events-none">€</span>
                          <input type="number" className="inp" style={{ paddingLeft: 16 }} value={d.weekBedrag} placeholder="weekbedrag" onChange={e => {
                            const week = parseFloat(e.target.value) || 0
                            const netto = ((d.inclVak ? week / 1.08 : week) * 52 / 12).toFixed(2)
                            set({ inkomenData: updArr(state.inkomenData, i, { weekBedrag: e.target.value, netto }) })
                          }} />
                        </div>
                        <label className="flex items-center gap-1 mt-1 text-[0.69rem] text-inkl cursor-pointer">
                          <input type="checkbox" checked={d.inclVak} className="accent-accent w-3 h-3" onChange={e => {
                            const week = parseFloat(d.weekBedrag) || 0
                            const netto = ((e.target.checked ? week / 1.08 : week) * 52 / 12).toFixed(2)
                            set({ inkomenData: updArr(state.inkomenData, i, { inclVak: e.target.checked, netto }) })
                          }} />
                          incl. 8% vakantiegeld
                        </label>
                        {mndBedrag > 0 && <div className="text-[0.69rem] text-accent mt-0.5">→ €{mndBedrag.toFixed(2)}/mnd excl. vak.</div>}
                      </div>
                    )}
                  </td>
                  <td><input className="inp" value={d.uren} placeholder="Bijv. 32u / vast" onChange={e => set({ inkomenData: updArr(state.inkomenData, i, { uren: e.target.value }) })} /></td>
                  <td className="text-center">
                    <label className="flex items-center justify-center gap-1 text-[0.77rem] cursor-pointer">
                      <input type="checkbox" checked={d.beslag} className="accent-warn w-3 h-3" onChange={e => set({ inkomenData: updArr(state.inkomenData, i, { beslag: e.target.checked }) })} />
                      <span>Ja</span>
                    </label>
                  </td>
                  <td><button type="button" className="text-warn border border-warn-border hover:bg-warns rounded px-1.5 py-0.5 text-[0.73rem] cursor-pointer" onClick={() => set({ inkomenData: rmArr(state.inkomenData, i) })}><HiXMark /></button></td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 mt-2 text-[0.78rem] text-accent border border-accent/40 rounded px-3 py-1 hover:bg-accents cursor-pointer"
          onClick={() => set({ inkomenData: [...state.inkomenData, mkInk()] })}
        >
          <HiPlus />
          Inkomstenbron toevoegen
        </button>

        {heeftBeslag && (
          <div className="mt-2">
            <Alert variant="gold" icon={<HiExclamationTriangle />} title="Beslag gelegd — beslagvrije voet controleren">
              Vul beslagleggers in zodat the BVV correct kan worden beoordeeld.
            </Alert>
            <div className="overflow-x-auto mt-2">
              <table className="tbl">
                <thead><tr><th>Beslagleggende schuldeiser</th><th>Soort beslag</th><th>Bedrag/mnd (indien bekend)</th><th></th></tr></thead>
                <tbody>
                  {state.beslagData.map((b, i) => (
                    <tr key={i}>
                      <td><input className="inp" value={b.wie} placeholder="Naam schuldeiser" onChange={e => set({ beslagData: updArr(state.beslagData, i, { wie: e.target.value }) })} /></td>
                      <td>
                        <select className="inp" value={b.soort} onChange={e => set({ beslagData: updArr(state.beslagData, i, { soort: e.target.value }) })}>
                          <option value="">—</option>
                          <option value="loonbeslag">Loonbeslag</option>
                          <option value="bankbeslag">Bankbeslag</option>
                          <option value="derdenbeslag">Derdenbeslag</option>
                          <option value="anders">Anders</option>
                        </select>
                      </td>
                      <td>
                        <div className="relative">
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-inkl text-[0.76rem] pointer-events-none">€</span>
                          <input type="number" className="inp" style={{ paddingLeft: 16 }} value={b.bedrag} placeholder="0" onChange={e => set({ beslagData: updArr(state.beslagData, i, { bedrag: e.target.value }) })} />
                        </div>
                      </td>
                      <td><button type="button" className="text-warn border border-warn-border hover:bg-warns rounded px-1.5 py-0.5 text-[0.73rem] cursor-pointer" onClick={() => set({ beslagData: rmArr(state.beslagData, i) })}><HiXMark /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 mt-2 text-[0.78rem] text-accent border border-accent/40 rounded px-3 py-1 hover:bg-accents cursor-pointer"
              onClick={() => set({ beslagData: [...state.beslagData, mkBeslag()] })}
            >
              <HiPlus />
              Beslaglegger toevoegen
            </button>
          </div>
        )}

        <hr className="border-rule my-3" />
        <div className={SL}>Alimentatie als inkomstenbron</div>
        <div className="mb-2">
          <label className={L}>Ontvangt cliënt alimentatie?</label>
          <RadioGroup value={state.alim_ontvangen} options={[{ value: 'nee', label: 'Nee' }, { value: 'ja', label: 'Ja' }]} onChange={v => set({ alim_ontvangen: v })} />
        </div>
        {state.alim_ontvangen === 'ja' && (
          <div className={row3}>
            <div><label className={L}>Partneralimentatie (netto/mnd)</label><EuroInput value={state.alim_partner} onChange={v => set({ alim_partner: v })} /></div>
            <div><label className={L}>Kinderalimentatie (netto/mnd)</label><EuroInput value={state.alim_kind} onChange={v => set({ alim_kind: v })} /></div>
            <div>
              <label className={L}>Via LBIO?</label>
              <RadioGroup value={state.alim_lbio} options={[{ value: 'ja', label: 'Ja' }, { value: 'nee', label: 'Nee' }]} onChange={v => set({ alim_lbio: v })} />
            </div>
          </div>
        )}

        {(pct <= 120 && !isPensioen && norm > 0 && ink > 0) && (
          <div>
            <hr className="border-rule my-3" />
            <div className={row2}>
              <div>
                <label className={L}>Individuele Inkomenstoeslag (IIT)</label>
                <select className="inp" value={state.iit} onChange={e => set({ iit: e.target.value })}>
                  <option value="">— Onbekend —</option>
                  <option value="ja">Ja, aangevraagd / actief</option>
                  <option value="nee">Nee, niet aangevraagd</option>
                  <option value="check">Controleren</option>
                  <option value="nvt">N.v.t.</option>
                </select>
                <div className="text-[0.7rem] text-inkl mt-0.5">3 jaar aaneengesloten ≤105% norm — niet voor pensioengerechtigden</div>
              </div>
              {(state.iit === 'nee' || state.iit === 'check') && (
                <div>
                  <label className={L}>Inkomen op dit niveau sinds</label>
                  <input type="date" className="inp" value={state.iit_datum} onChange={e => set({ iit_datum: e.target.value })} />
                  {iitDuur !== null && (
                    <div className="text-[0.7rem] mt-0.5" style={{ color: iitDuur >= 3 ? 'var(--color-accent)' : 'var(--color-inkl)' }}>
                      {iitDuur >= 3 ? (
                        <div className="flex items-center gap-1">
                          <HiCheckCircle />
                          <span>{iitDuur.toFixed(1)} jaar — IIT kan worden aangevraagd!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <HiOutlineClock className="opacity-60" />
                          <span>{iitDuur.toFixed(1)} jr — nog ${(3 - iitDuur).toFixed(1)} jr te gaan</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-3">
          <label className={L}>Toelichting inkomenssituatie</label>
          <textarea className="inp" rows={2} value={state.inkomen_toel} onChange={e => set({ inkomen_toel: e.target.value })} placeholder="Bijzonderheden..." />
        </div>
      </Card>

      <NavRow
        onBack={() => goTo(3)}
        backLabel={<><HiArrowLeft className="inline-block mr-1" /> Vermogen</>}
        onNext={() => goTo(5)}
        nextLabel={<>Toeslagen <HiArrowRight className="inline-block ml-1" /></>}
      />
    </div>
  )
}
