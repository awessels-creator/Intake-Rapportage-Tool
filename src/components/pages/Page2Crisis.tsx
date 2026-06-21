import { useForm } from '../../context'
import { updArr, rmArr, mkBank } from '../../utils'
import type { BankItem } from '../../types'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import RadioGroup from '../shared/RadioGroup'
import Alert from '../shared/Alert'
import { HiBellAlert, HiOutlineBuildingLibrary, HiOutlineLightBulb, HiOutlineBuildingOffice, HiOutlineDocumentText, HiXMark, HiArrowLeft, HiArrowRight, HiPlus } from 'react-icons/hi2'

const L = 'block text-[.69rem] font-semibold text-inkl uppercase tracking-[.05em]'
const row2 = 'grid grid-cols-2 gap-[11px] mb-[11px]'
const row3 = 'grid grid-cols-3 gap-[11px] mb-[11px]'

export default function Page2Crisis() {
  const { state, set, goTo } = useForm()

  const hasRood = state.bankData.some(b => b.rood)

  return (
    <div>
      <Card icon={<HiBellAlert />} title="Crisis & Urgentie">
        <div className="mb-[11px]">
          <label className={L}>Is er sprake van een crisissituatie?</label>
          <RadioGroup value={state.crisis} options={[{ value: 'nee', label: 'Nee' }, { value: 'ja', label: 'Ja' }]} onChange={v => set({ crisis: v })} />
        </div>

        {state.crisis === 'ja' && (
          <div className="mb-[11px]">
            <div className="grid grid-cols-2 gap-[5px] mb-[11px]">
              {([['cr_water', 'Dreigende afsluiting water'], ['cr_energie', 'Dreigende afsluiting gas/energie'], ['cr_ontruiming', 'Dreigende huisontruiming'], ['cr_anders', 'Anders (zie toelichting)']] as const).map(([k, label]) => (
                <label key={k} className="flex items-center gap-[7px] px-[9px] py-[6px] border-[1.5px] border-rule rounded-[6px] cursor-pointer hover:bg-warm text-[0.81rem]">
                  <input type="checkbox" checked={state[k]} onChange={e => set({ [k]: e.target.checked })} className="accent-accent w-[13px] h-[13px]" />
                  {label}
                </label>
              ))}
            </div>
            <label className={L}>Toelichting crisissituatie</label>
            <textarea className="inp" rows={3} value={state.crisis_toelichting} onChange={e => set({ crisis_toelichting: e.target.value })} placeholder="Beschrijf de crisissituatie en acties..." />
          </div>
        )}

      </Card>

      <Card icon={<HiOutlineDocumentText />} title="Reden aanmelding">
        <div className="mb-[11px]">
          <label className={L}>Reden aanmelding / hulpvraag</label>
          <textarea className="inp" rows={3} value={state.hulpvraag} onChange={e => set({ hulpvraag: e.target.value })} placeholder="Wat is de hulpvraag en het financiële probleem? Hoe is cliënt bij ons terechtgekomen?" />
        </div>

        <div>
          <label className={L}>Eerdere aanvragen schuldhulpverlening / WSNP / OBS / BBR?</label>
          <RadioGroup value={state.eerder_aanvr} options={[{ value: 'nee', label: 'Nee' }, { value: 'ja', label: 'Ja' }]} onChange={v => set({ eerder_aanvr: v })} />
          {state.eerder_aanvr === 'ja' && (
            <textarea className="inp mt-2" rows={2} value={state.eerder_aanvr_toel} onChange={e => set({ eerder_aanvr_toel: e.target.value })} placeholder="Toelichting eerdere aanvragen..." />
          )}
        </div>
      </Card>

      <Card icon={<HiOutlineBuildingLibrary />} title="Bankrekening(en)">
        <p className="text-[0.77rem] text-inkl mb-[11px]">Alle rekeningen vermelden, inclusief die van kinderen.</p>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>IBAN</th><th>Tenaamstelling</th><th>Type</th>
                <th>Saldo</th><th>Roodstand</th><th>Nieuwe rek. besproken?</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.bankData.map((b, i) => (
                <tr key={i}>
                  <td><input className="inp uppercase" style={{ minWidth: 140 }} value={b.iban} placeholder="NL00 BANK..." onChange={e => set({ bankData: updArr(state.bankData, i, { iban: e.target.value }) })} /></td>
                  <td><input className="inp" style={{ minWidth: 100 }} value={b.naam} placeholder="T.n.v. ..." onChange={e => set({ bankData: updArr(state.bankData, i, { naam: e.target.value }) })} /></td>
                  <td>
                    <select className="inp" style={{ minWidth: 75 }} value={b.type} onChange={e => set({ bankData: updArr(state.bankData, i, { type: e.target.value as BankItem['type'] }) })}>
                      <option value="betaal">Betaal</option>
                      <option value="spaar">Spaar</option>
                      <option value="kind">Kind</option>
                      <option value="anders">Anders</option>
                    </select>
                  </td>
                  <td>
                    <div className="relative" style={{ minWidth: 80 }}>
                      <span className="absolute left-[6px] top-1/2 -translate-y-1/2 text-inkl text-[0.78rem] pointer-events-none">€</span>
                      <input type="number" className="inp" style={{ paddingLeft: 16 }} value={b.saldo} placeholder="0" onChange={e => set({ bankData: updArr(state.bankData, i, { saldo: e.target.value }) })} />
                    </div>
                  </td>
                  <td className="text-center">
                    <label className="flex items-center justify-center gap-1 text-[0.77rem] cursor-pointer">
                      <input type="checkbox" checked={b.rood} className="accent-warn w-[13px] h-[13px]" onChange={e => set({ bankData: updArr(state.bankData, i, { rood: e.target.checked }) })} />
                      <span className={b.rood ? 'text-warn' : 'text-inkl'}>Rood</span>
                    </label>
                  </td>
                  <td>
                    <select className="inp" style={{ minWidth: 110 }} value={b.nieuw} onChange={e => set({ bankData: updArr(state.bankData, i, { nieuw: e.target.value }) })}>
                      <option value="">—</option>
                      <option value="ja">Ja, besproken</option>
                      <option value="aanvragen">Aanvragen</option>
                      <option value="nee">Niet nodig</option>
                    </select>
                  </td>
                  <td><button type="button" className="bg-none border-none text-warn text-[0.88rem] px-1 py-0.5 cursor-pointer" onClick={() => set({ bankData: rmArr(state.bankData, i) })}><HiXMark /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 mt-[7px] text-[0.75rem] text-inkl font-medium bg-warm border-[1.5px] border-dashed border-rule rounded-[5px] px-[11px] py-[5px] hover:border-accent hover:text-accent hover:bg-accents cursor-pointer"
          onClick={() => set({ bankData: [...state.bankData, mkBank()] })}
        >
          <HiPlus />
          Rekening toevoegen
        </button>
        <div className="mt-3">
          <label className={L}>Toelichting bankrekening(en)</label>
          <textarea className="inp" rows={2} value={state.bank_toelichting} onChange={e => set({ bank_toelichting: e.target.value })} placeholder="Toelichting bankrekeningen: afspraken, bijzonderheden, achterstanden..." />
        </div>
        {hasRood && (
          <Alert variant="gold" icon={<HiOutlineLightBulb />} title="Roodstand aanwezig">
            Adviseer nieuwe (gratis basis)bankrekening te openen. Noteer afspraken in de toelichting hieronder.
          </Alert>
        )}
      </Card>

      <Card icon={<HiOutlineBuildingOffice />} title="Onderneming">
        <div className="mb-[11px]">
          <label className={L}>Is / was cliënt ondernemer?</label>
          <RadioGroup
            value={state.ondernemer}
            options={[{ value: 'nee', label: 'Nee' }, { value: 'actief', label: 'Ja, actief' }, { value: 'gestopt', label: 'Ja, gestopt' }]}
            onChange={v => set({ ondernemer: v })}
          />
        </div>
        {(state.ondernemer === 'actief' || state.ondernemer === 'gestopt') && (
          <div>
            <div className={row3}>
              <div><label className={L}>Bedrijfsnaam</label><input className="inp" value={state.kvk_naam} onChange={e => set({ kvk_naam: e.target.value })} placeholder="Naam onderneming" /></div>
              <div><label className={L}>KvK-nummer</label><input className="inp" value={state.kvk_nr} onChange={e => set({ kvk_nr: e.target.value })} placeholder="00000000" /></div>
              {state.ondernemer === 'gestopt' && <div><label className={L}>Datum uitschrijving</label><input type="date" className="inp" value={state.kvk_datum} onChange={e => set({ kvk_datum: e.target.value })} /></div>}
            </div>
            <div className={row2}>
              <div>
                <label className={L}>Boekhouding op orde?</label>
                <RadioGroup value={state.boekhouding} options={[{ value: 'ja', label: 'Ja' }, { value: 'nee', label: 'Nee' }, { value: 'onbekend', label: 'Onbekend' }]} onChange={v => set({ boekhouding: v })} />
              </div>
              <div>
                <label className={L}>Belastingaangiften gedaan?</label>
                <RadioGroup value={state.aangifte} options={[{ value: 'ja', label: 'Ja' }, { value: 'nee', label: 'Nee' }, { value: 'achterstand', label: 'Achterstand' }]} onChange={v => set({ aangifte: v })} />
              </div>
            </div>
            <label className={L}>Toelichting onderneming / afspraken boekhouding & aangifte</label>
            <textarea className="inp" rows={2} value={state.kvk_toel} onChange={e => set({ kvk_toel: e.target.value })} placeholder="Zakelijke schulden, belastingschulden, gemaakte afspraken..." />
          </div>
        )}
      </Card>

      <NavRow
        onBack={() => goTo(1)}
        backLabel={<><HiArrowLeft className="inline-block mr-1" /> Persoonlijk</>}
        onNext={() => goTo(3)}
        nextLabel={<>Vermogen <HiArrowRight className="inline-block ml-1" /></>}
      />
    </div>
  )
}
