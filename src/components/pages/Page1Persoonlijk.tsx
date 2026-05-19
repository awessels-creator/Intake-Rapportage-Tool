import { useForm } from '../../context'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import RadioGroup from '../shared/RadioGroup'
import { HiUsers, HiArrowLeft, HiArrowRight } from 'react-icons/hi2'

const L = 'block text-[.69rem] font-semibold text-inkl uppercase tracking-[.05em]'
const SL = 'text-[.69rem] font-semibold text-inkl uppercase tracking-[.05em] mt-[3px] mb-[7px] pb-[3px] border-b border-rule'
const row3 = 'grid grid-cols-3 gap-[11px] mb-[11px]'

export default function Page1Persoonlijk() {
  const { state, set, goTo } = useForm()

  return (
    <div>
      <Card icon={<HiUsers />} title="Persoonlijke omstandigheden & Achtergrond">
        <div className={SL}>Woonsituatie / sociaal netwerk</div>
        <div className="mb-[11px]">
          <label className={L}>Achtergrond wonen, leven en netwerk</label>
          <textarea className="inp" rows={3} value={state.persoonlijk}
            onChange={e => set({ persoonlijk: e.target.value })}
            placeholder="Woonsituatie, sociaal netwerk, mantelzorg, isolement, gezondheid, relevante persoonlijke omstandigheden..." />
        </div>

        <hr className="border-rule my-[13px]" />
        <div className={SL}>Opleiding / Werk / Toekomstperspectief</div>
        <div className="mb-[11px]">
          <label className={L}>Opleidingen, werkervaring, inspanningsmogelijkheden, toekomstperspectief</label>
          <textarea className="inp" rows={3} value={state.opleiding_toel}
            onChange={e => set({ opleiding_toel: e.target.value })}
            placeholder="Opleidingsniveau, werkervaring, kansen op de arbeidsmarkt, re-integratietraject, perspectief..." />
        </div>

        <hr className="border-rule my-[13px]" />
        <div className={SL}>Flankerende hulpverlening</div>
        <div className="mb-[11px]">
          <label className={L}>Flankerende hulpverlening aanwezig?</label>
          <RadioGroup value={state.flank} options={[{ value: 'nee', label: 'Nee' }, { value: 'ja', label: 'Ja' }]} onChange={v => set({ flank: v })} />
        </div>

        {state.flank === 'ja' && (
          <div>
            <div className={row3}>
              <div><label className={L}>Instantie / organisatie</label><input className="inp" value={state.flank_inst} onChange={e => set({ flank_inst: e.target.value })} placeholder="Naam instantie" /></div>
              <div><label className={L}>Naam hulpverlener</label><input className="inp" value={state.flank_naam} onChange={e => set({ flank_naam: e.target.value })} placeholder="Naam contactpersoon" /></div>
              <div><label className={L}>Contactgegevens</label><input className="inp" value={state.flank_contact} onChange={e => set({ flank_contact: e.target.value })} placeholder="Telefoon / e-mail" /></div>
            </div>
            <div>
              <label className={L}>Aard van de hulpverlening</label>
              <input className="inp" value={state.flank_aard} onChange={e => set({ flank_aard: e.target.value })} placeholder="Bijv. maatschappelijk werk, GGZ, Wmo-begeleiding..." />
            </div>
          </div>
        )}
      </Card>

      <NavRow
        onBack={() => goTo(0)}
        backLabel={<><HiArrowLeft className="inline-block mr-1" /> Cliënt</>}
        onNext={() => goTo(2)}
        nextLabel={<>Aanvraag <HiArrowRight className="inline-block ml-1" /></>}
      />
    </div>
  )
}
