import { useForm } from '../../context'
import { SCHULD_INFO } from '../../constants'
import { updArr, rmArr, mkSchuld } from '../../utils'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import { HiOutlineClipboardDocumentList, HiXMark, HiArrowLeft, HiArrowRight, HiPlus } from 'react-icons/hi2'

const L = 'block text-[.76rem] text-inkl mb-0.5 font-medium'
const row2 = 'grid grid-cols-2 gap-3 mb-3'

export default function Page7Schulden() {
  const { state, set, goTo } = useForm()

  const tot = state.schuldenData.reduce((s, d) => s + (parseFloat(d.b) || 0), 0)

  return (
    <div>
      <Card icon={<HiOutlineClipboardDocumentList />} title="Schulden & Betalingsachterstanden">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Schuldeiser</th><th>Soort</th><th>Openstaand</th>
                <th>Aflospl./mnd</th><th>Preferent</th><th>Schone lei?</th>
                <th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {state.schuldenData.map((s, i) => {
                const info = SCHULD_INFO[s.t] || { pref: '—', lei: '—' }
                return (
                  <tr key={i}>
                    <td>
                      <input className="inp" style={{ minWidth: 120 }} value={s.s} placeholder="Schuldeiser"
                        onChange={e => set({ schuldenData: updArr(state.schuldenData, i, { s: e.target.value }) })} />
                    </td>
                    <td>
                      <select className="inp" style={{ minWidth: 120 }} value={s.t}
                        onChange={e => set({ schuldenData: updArr(state.schuldenData, i, { t: e.target.value, subt: '' }) })}>
                        <option value="">—</option>
                        <option value="huur">Huurachterstand</option>
                        <option value="energie">Energieschuld</option>
                        <option value="belasting">Belastingschuld</option>
                        <option value="zorg">Zorgverzekeraar</option>
                        <option value="krediet">Krediet/lening</option>
                        <option value="incasso">Incasso</option>
                        <option value="deurw">Deurwaarder</option>
                        <option value="boete_mulder">Boete (Mulder/CJIB)</option>
                        <option value="boete_terwee">Boete (Terwee/slachtoffer)</option>
                        <option value="studie">Studieschuld (DUO)</option>
                        <option value="alimentatie">Alimentatieschuld</option>
                        <option value="overig">Overig</option>
                      </select>
                      {s.t === 'studie' && (
                        <select className="inp mt-1 text-[0.74rem]" value={s.subt}
                          onChange={e => set({ schuldenData: updArr(state.schuldenData, i, { subt: e.target.value }) })}>
                          <option value="">Aflosfase?</option>
                          <option value="nog_niet">Nog geen aflosplicht</option>
                          <option value="lopend">Lopend aflossing</option>
                          <option value="achterstand">Achterstand</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <div className="relative" style={{ minWidth: 85 }}>
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-inkl text-[0.76rem] pointer-events-none">€</span>
                        <input type="number" className="inp" style={{ paddingLeft: 16 }} value={s.b} placeholder="0"
                          onChange={e => set({ schuldenData: updArr(state.schuldenData, i, { b: e.target.value }) })} />
                      </div>
                    </td>
                    <td>
                      <div className="relative" style={{ minWidth: 80 }}>
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-inkl text-[0.76rem] pointer-events-none">€</span>
                        <input type="number" className="inp" style={{ paddingLeft: 16 }} value={s.afl} placeholder="0"
                          onChange={e => set({ schuldenData: updArr(state.schuldenData, i, { afl: e.target.value }) })} />
                      </div>
                    </td>
                    <td className="text-[0.72rem] text-inkl" style={{ minWidth: 90 }}>{info.pref}</td>
                    <td className="text-[0.72rem] text-inkl" style={{ minWidth: 110 }}>{info.lei}</td>
                    <td>
                      <select className="inp" style={{ minWidth: 95 }} value={s.st}
                        onChange={e => set({ schuldenData: updArr(state.schuldenData, i, { st: e.target.value }) })}>
                        <option value="">—</option>
                        <option value="lopend">Lopend</option>
                        <option value="ach">Achterstand</option>
                        <option value="deurw">Deurwaarder</option>
                        <option value="betw">Betwist</option>
                        <option value="afg">Afgelost</option>
                      </select>
                    </td>
                    <td>
                      <button type="button" className="text-warn border border-warn-border hover:bg-warns rounded px-1.5 py-0.5 text-[0.73rem] cursor-pointer"
                        onClick={() => set({ schuldenData: rmArr(state.schuldenData, i) })}><HiXMark /></button>
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
          onClick={() => set({ schuldenData: [...state.schuldenData, mkSchuld()] })}
        >
          <HiPlus />
          Schuld toevoegen
        </button>

        {tot > 0 && (
          <div className="flex justify-between items-center mt-3 p-2.5 bg-warm rounded-lg border border-rule">
            <span className="font-semibold text-[0.88rem]">Geschatte totale schuldenlast</span>
            <span className="font-bold text-[0.97rem]">€ {tot.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        <hr className="border-rule my-3" />
        <div className={row2}>
          <div>
            <label className={L}>Achterstand huur?</label>
            <select className="inp" value={state.ach_huur} onChange={e => set({ ach_huur: e.target.value })}>
              <option value="nee">Nee</option>
              <option value="ja">Ja</option>
            </select>
          </div>
          <div>
            <label className={L}>Achterstand energie?</label>
            <select className="inp" value={state.ach_energie} onChange={e => set({ ach_energie: e.target.value })}>
              <option value="nee">Nee</option>
              <option value="ja">Ja</option>
            </select>
          </div>
        </div>
        <div className={row2}>
          <div>
            <label className={L}>Gezamenlijke schulden met ex-partner?</label>
            <select className="inp" value={state.sch_exparter} onChange={e => set({ sch_exparter: e.target.value })}>
              <option value="nvt">N.v.t.</option>
              <option value="nee">Nee</option>
              <option value="ja">Ja</option>
            </select>
          </div>
        </div>

        <label className={L}>Toelichting schuldensituatie / financiële zelfredzaamheid</label>
        <textarea className="inp" rows={3} value={state.schulden_opm} onChange={e => set({ schulden_opm: e.target.value })}
          placeholder="Lopende trajecten, deurwaarder, aard van de schulden, eigen inzicht cliënt..." />
      </Card>

      <NavRow
        onBack={() => goTo(6)}
        backLabel={<><HiArrowLeft className="inline-block mr-1" /> Vaste Lasten</>}
        onNext={() => goTo(8)}
        nextLabel={<>Regelcheck <HiArrowRight className="inline-block ml-1" /></>}
      />
    </div>
  )
}
