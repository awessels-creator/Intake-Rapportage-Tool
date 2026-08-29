import { useForm } from '../../context'
import { useNormen } from '../../context/NormContext'
import { BIJSTAND_LABELS, MODEL } from '../../constants'
import { getTotaalInkomen, getBeslagTotaal, getBeschikbaarInkomen, nl, updArr, rmArr, mkInk, mkBeslag, yearsSince, isJeugdOfInstelling, lftdN } from '../../utils'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import RadioGroup from '../shared/RadioGroup'
import EuroInput from '../shared/EuroInput'
import QuickPreview from '../QuickPreview'
import Alert from '../shared/Alert'
import { HiExclamationTriangle, HiOutlineClock, HiOutlineInformationCircle, HiOutlineBuildingLibrary, HiXMark, HiArrowLeft, HiArrowRight, HiPlus, HiCheckCircle, HiArrowTopRightOnSquare } from 'react-icons/hi2'
import { BsCashStack } from 'react-icons/bs'

const L = 'block text-[.76rem] text-inkl mb-0.5 font-medium'
const SL = 'text-[0.67rem] font-semibold text-inkl uppercase tracking-widest mb-2 pb-1 border-b border-rule'
const row2 = 'grid grid-cols-2 gap-3 mb-3'
const row3 = 'grid grid-cols-3 gap-3 mb-3'

export default function Page4Inkomen() {
  const { state, set, goTo } = useForm()
  const { NORM, NORMPERIODE, BVV_MAX } = useNormen()

  const norm = parseFloat(state.bijstandsnorm) || 0
  const ink = getTotaalInkomen(state)
  const pct = norm && ink ? (ink / norm) * 100 : 0
  const isPensioen = state.leefsituatie.startsWith('pensioen')
  const heeftBeslag = state.inkomenData.some(d => d.beslag)
  const isJeugdInst = isJeugdOfInstelling(state.leefsituatie)
  const leeftijd = lftdN(state.geboortedatum)
  const onder21 = leeftijd >= 0 && leeftijd < 21
  const ls = state.leefsituatie
  const hK = state.kinderen === 'ja'
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

  const badgeColor = pct < 100 ? 'var(--color-warn-dark)' : pct < 105 ? 'var(--color-ok-dark)' : pct < 120 ? 'var(--color-gold-dark)' : 'var(--color-info-text)'
  const badgeBg = pct < 100 ? 'var(--color-warns)' : pct < 105 ? 'var(--color-oks)' : pct < 120 ? 'var(--color-golds)' : 'var(--color-infos)'

  const iitDuur = yearsSince(state.iit_datum)

  return (
    <div>
      <Card icon={<BsCashStack />} title="Inkomen">
        <div className="bg-warm border border-rule rounded-lg p-3 text-[0.77rem] mb-3">
          <strong className="text-[0.79rem]">Bijstandsnormen {NORMPERIODE.label} (netto excl. vakantietoeslag)</strong>
          <table className="w-full mt-1 text-[0.76rem]">
            <tbody>
              {BIJSTAND_LABELS.map(({ key, label }) => (
                <tr key={key}>
                  <td className="text-inkl py-0.5 pr-2">{label}</td>
                  <td className="font-semibold">€ {NORM[key]?.toLocaleString('nl-NL')}/mnd</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={row2}>
          <div>
            <label className={L}>Bijstandsnorm (netto/mnd)</label>
            {isJeugdInst ? (
              <div className="mt-1.5">
                <div className="text-[0.77rem] text-warn font-semibold mb-1">Geen automatische norm — vul de juiste (verlaagde) norm in</div>
                <input type="number" className="inp" placeholder="0" value={state.bijstandsnorm} onChange={e => set({ bijstandsnorm: e.target.value })} />
                <input className="inp mt-1" placeholder="Bron norm (bijv. PW-tabel, overheid.nl)" value={state.norm_bron || ''} onChange={e => set({ norm_bron: e.target.value })} />
                <div className="text-[0.67rem] text-inkl mt-0.5">Bij jeugd &lt;21 of verblijf in een instelling geldt een verlaagde norm (kostendelersnorm / zak- en kleedgeldnorm). De tool rekent deze niet zelf uit.</div>
              </div>
            ) : state.leefsituatie && NORM[state.leefsituatie] ? (
              <div className="text-[0.9rem] font-semibold text-ink py-1.5">
                €{NORM[state.leefsituatie].toLocaleString('nl-NL')} excl. VT
                <span className="text-[0.7rem] text-inkl font-normal ml-2">(€{Math.round(NORM[state.leefsituatie] * 1.05).toLocaleString('nl-NL')} incl. VT)</span>
              </div>
            ) : (
              <div className="text-[0.77rem] text-inkl italic py-1.5">Selecteer eerst een leefsituatie op pagina 1</div>
            )}
            <input type="hidden" value={state.bijstandsnorm} />
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
            <thead><tr><th>Bron / Werkgever / Instantie</th><th>Type inkomen</th><th>Invoer per</th><th>Netto/mnd *</th><th>Dienstverband / uren</th><th>Beslag?</th><th></th></tr></thead>
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
        <p className="text-[0.7rem] text-inkl mt-2">
          * Vul hier het netto bedrag in dat de cliënt ontvangt <strong>vóórdat</strong> er beslag op wordt gelegd (bruto-netto). Zet bij "Beslag?" het vinkje aan en vul het beslagbedrag in; de tool trekt dat automatisch af voor het beschikbaar inkomen, het besteedbaar inkomen en het budgetplan. Weet de cliënt het beslagbedrag niet? Laat die het opzoeken, of zet "bij benadering" in de toelichting bij de beslaglegger.
        </p>
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
              Vul beslagleggers in zodat de BVV correct kan worden beoordeeld.
              {(() => {
                const beslag = getBeslagTotaal(state)
                const beschikbaar = getBeschikbaarInkomen(state)
                if (beslag <= 0) return null
                return (
                  <span className="block mt-1 font-semibold">
                    Totaal beslag: €{nl(beslag)}/mnd · Daadwerkelijk beschikbaar inkomen: €{nl(beschikbaar)}/mnd
                  </span>
                )
              })()}
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

            {isJeugdOfInstelling(ls) ? (
              <div className="mt-3 bg-white rounded-xl border border-warn-border shadow-sm p-4">
                <Alert variant="warn" icon={<HiExclamationTriangle />} title="Beslagvrije voet niet geautomatiseerd">
                  Bij een jeugdige &lt;21 of verblijf in een instelling geldt een verlaagde norm (kostendelersnorm / zak- en kleedgeldnorm). De tool berekent de beslagvrije voet hier niet zelf uit. Controleer de beslagvrije voet altijd via uwbeslagvrijevoet.nl aan de hand van de ingevulde (verlaagde) norm en de feitelijke woonsituatie.
                </Alert>
                <a
                  href="https://bereken.uwbeslagvrijevoet.nl/calculate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-accent text-white text-[0.78rem] font-medium hover:opacity-90"
                >
                  <HiArrowTopRightOnSquare className="inline-block" /> Controleer de beslagvrije voet via uwbeslagvrijevoet.nl
                </a>
              </div>
            ) : bvv && (
              <div className="mt-3 bg-white rounded-xl border border-rule shadow-sm p-4">
                <div className="font-semibold text-[0.9rem] text-accent mb-3">Beslagvrije Voet (indicatie basis, model {MODEL})</div>
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
                  href="https://bereken.uwbeslagvrijevoet.nl/calculate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-accent text-white text-[0.78rem] font-medium hover:opacity-90"
                >
                  <HiArrowTopRightOnSquare className="inline-block" /> Controleer de volledige beslagvrije voet via bereken.uwbeslagvrijevoet.nl
                </a>
              </div>
            )}

            {/* Vraag: is de beslagvrije voet gecontroleerd? */}
            <div className="mt-3 p-2.5 bg-warm rounded-lg border border-rule">
              <div className={L}>Is de beslagvrije voet gecontroleerd?</div>
              <RadioGroup
                value={state.bv_gecontroleerd}
                options={[
                  { value: 'ja', label: 'Ja' },
                  { value: 'nee', label: 'Nee' },
                  { value: 'fout', label: 'Ja, maar niet correct toegepast' },
                ]}
                onChange={v => set({ bv_gecontroleerd: v as 'ja' | 'nee' | 'fout' | '' })}
              />
              {state.bv_gecontroleerd === 'fout' && (
                <div className="mt-2">
                  <label className={L}>Toelichting (bijv. herberekening aangevraagd door wie / nog te doen):</label>
                  <textarea
                    className="ta"
                    rows={2}
                    value={state.bv_toel}
                    placeholder="Bijv.: herberekening aangevraagd bij schuldeiser op 1-9-2026, nog niet ontvangen. Of: nog in te dienen door consulent."
                    onChange={e => set({ bv_toel: e.target.value })}
                  />
                </div>
              )}
            </div>

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
        {state.alim_ontvangen === 'ja' && (
          <p className="text-[0.7rem] text-inkl mb-2">
            Let op: als de alimentatie is vastgesteld maar (nog) niet daadwerkelijk wordt ontvangen, vermeld dat dan in de toelichting bij "Inkomenssituatie" hieronder of bij de betreffende bron. De tool rekent het bedrag wél mee als inkomen.
          </p>
        )}

        {(pct <= 120 && !isPensioen && !isJeugdInst && !onder21 && norm > 0 && ink > 0) && (
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
          <QuickPreview fieldKey="inkomen_toel" />
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
