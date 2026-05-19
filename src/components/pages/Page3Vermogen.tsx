import { useForm } from '../../context'
import { VGRENS } from '../../constants'
import { nl } from '../../utils'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import RadioGroup from '../shared/RadioGroup'
import ToggleWidget from '../shared/ToggleWidget'
import EuroInput from '../shared/EuroInput'
import Alert from '../shared/Alert'
import { HiOutlineBell, HiOutlineInformationCircle, HiExclamationTriangle, HiOutlineCheckCircle, HiArrowLeft, HiArrowRight, HiCheck, HiXMark, HiArrowSmallRight, HiCheckCircle } from 'react-icons/hi2'
import { IoDiamondOutline } from 'react-icons/io5'
import { BsCarFront } from 'react-icons/bs'

const L = 'block text-[.76rem] text-inkl mb-0.5 font-medium'
const SL = 'text-[0.67rem] font-semibold text-inkl uppercase tracking-widest mb-2 pb-1 border-b border-rule'
const row2 = 'grid grid-cols-2 gap-3 mb-3'
const row3 = 'grid grid-cols-3 gap-3 mb-3'
const row4 = 'grid grid-cols-4 gap-3 mb-3'

const TW_VERZ = [
  { v: 'ja', l: <div className="flex items-center gap-1"><HiCheck /> Ja</div> },
  { v: 'nee', l: <div className="flex items-center gap-1"><HiXMark /> Nee</div> },
  { v: 'aanvr', l: <div className="flex items-center gap-1"><HiArrowSmallRight /> Aanvragen</div> }
]
const TW_VERZ_NVT = [
  { v: 'ja', l: <div className="flex items-center gap-1"><HiCheck /> Ja</div> },
  { v: 'nee', l: <div className="flex items-center gap-1"><HiXMark /> Nee</div> },
  { v: 'nvt', l: '— N.v.t.' }
]

export default function Page3Vermogen() {
  const { state, set, goTo } = useForm()

  const sp = (parseFloat(state.spaargeld) || 0) + (parseFloat(state.overig_verm) || 0) + (parseFloat(state.beleggingen) || 0)
  const aw = state.heeft_auto === 'ja' ? (parseFloat(state.auto_waarde) || 0) : 0
  const owex = state.eigen_woning === 'ja' ? Math.max(0, (parseFloat(state.overwaarde) || 0) - 67500) : 0
  const tot = sp + aw + owex
  const grens = VGRENS[state.leefsituatie] || 8000

  const verzSignalen = (() => {
    const sigs: { variant: 'warn' | 'gold' | 'info'; icon: React.ReactNode; title: string; msg: string }[] = []
    if (state.tw_avp === 'nee') sigs.push({ variant: 'gold', icon: <HiOutlineBell />, title: 'AVP ontbreekt', msg: 'Aansprakelijkheidsverzekering is niet aanwezig. Adviseer aanvragen.' })
    if (state.tw_inboedel === 'nee') sigs.push({ variant: 'gold', icon: <HiOutlineBell />, title: 'Inboedelverzekering ontbreekt', msg: 'Adviseer aanvragen.' })
    if (state.tw_uitvaart === 'nee') sigs.push({ variant: 'info', icon: <HiOutlineInformationCircle />, title: 'Uitvaartverzekering ontbreekt', msg: 'Bespreek wenselijkheid.' })
    if (state.eigen_woning === 'ja' && state.tw_opstal === 'nee') sigs.push({ variant: 'warn', icon: <HiExclamationTriangle />, title: 'Opstalverzekering ontbreekt bij koopwoning', msg: 'Bij hypotheek doorgaans verplicht.' })
    return sigs
  })()

  const autoAdv = (() => {
    if (state.heeft_auto !== 'ja') return null
    const w = parseFloat(state.auto_waarde) || 0
    if (w > 3000) return `Autowaarde >€3.000. Telt als vermogen. Noodzaak goed vastleggen.`
    return null
  })()

  const autoNote = (() => {
    if (state.heeft_auto !== 'ja') return null
    const v = state.auto_verm
    const reden = state.auto_reden
    if (v === 'behoud') return { msg: 'Vastgelegd: behouden', color: 'var(--color-accent)' }
    if (v === 'verkoop') return { msg: 'Vastgelegd: verkopen', color: 'var(--color-warn)' }
    if (reden === 'werk' || reden === 'medisch') return { msg: <div className="flex items-center gap-1"><HiCheckCircle /> Werk/medisch = sterke grond voor behoud</div>, color: 'var(--color-accent)' }
    if (reden === 'geen') return { msg: <div className="flex items-center gap-1"><HiExclamationTriangle /> Geen bijzondere reden — verkoop kan worden verlangd</div>, color: 'var(--color-warn)' }
    return null
  })()

  return (
    <div>
      <Card icon={<IoDiamondOutline />} title="Vermogen & Bezittingen">
        <div className="bg-warm border border-rule rounded-lg p-3 text-[0.77rem] mb-3">
          <strong className="text-[0.79rem]">Vermogensgrenzen Participatiewet 2026</strong>
          <table className="w-full mt-1 text-[0.76rem]">
            <tbody>
              <tr><td className="text-inkl py-0.5 pr-2">Alleenstaande</td><td className="font-semibold">€ 8.000</td></tr>
              <tr><td className="text-inkl py-0.5 pr-2">Alleenstaande ouder / Gezin</td><td className="font-semibold">€ 16.000</td></tr>
              <tr><td className="text-inkl py-0.5 pr-2">Pensioengerechtigde (alleen/paar)</td><td className="font-semibold">€ 8.000 / €16.000</td></tr>
              <tr><td className="text-inkl py-0.5 pr-2">Vrijstelling overwaarde eigen woning</td><td className="font-semibold">€ 67.500</td></tr>
            </tbody>
          </table>
        </div>

        <div className={row3}>
          <div><label className={L}>Spaargeld / bank</label><EuroInput value={state.spaargeld} onChange={v => set({ spaargeld: v })} /></div>
          <div><label className={L}>Contant / overig</label><EuroInput value={state.overig_verm} onChange={v => set({ overig_verm: v })} /></div>
          <div><label className={L}>Beleggingen / crypto</label><EuroInput value={state.beleggingen} onChange={v => set({ beleggingen: v })} /></div>
        </div>

        <div className={row2}>
          <div>
            <label className={L}>Eigen woning?</label>
            <select className="inp" value={state.eigen_woning} onChange={e => set({ eigen_woning: e.target.value })}>
              <option value="nee">Nee, huurwoning</option>
              <option value="ja">Ja, koopwoning</option>
            </select>
          </div>
          {state.eigen_woning === 'ja' && (
            <div>
              <label className={L}>Overwaarde woning</label>
              <EuroInput value={state.overwaarde} onChange={v => set({ overwaarde: v })} />
              <div className="text-[0.7rem] text-inkl mt-0.5">Eerste €67.500 vrijgesteld</div>
            </div>
          )}
        </div>

        <div className="mb-2">
          <label className={L}>Heeft cliënt een auto of motor?</label>
          <RadioGroup value={state.heeft_auto} options={[{ value: 'ja', label: 'Ja' }, { value: 'nee', label: 'Nee' }]} onChange={v => set({ heeft_auto: v })} />
        </div>

        {state.heeft_auto === 'ja' && (
          <div className="bg-warm border border-rule rounded-lg p-3 mb-3">
            <div className="text-[0.78rem] font-semibold text-inkl mb-2"><BsCarFront className="inline-block mr-1" /> Voertuiggegevens</div>
            <div className={row4}>
              <div><label className={L}>Kenteken</label><input className="inp uppercase" value={state.auto_kenteken} onChange={e => set({ auto_kenteken: e.target.value })} placeholder="AB-12-CD" /></div>
              <div><label className={L}>Merk / Type</label><input className="inp" value={state.auto_merk} onChange={e => set({ auto_merk: e.target.value })} placeholder="Opel Corsa" /></div>
              <div><label className={L}>Bouwjaar</label><input type="number" className="inp" value={state.auto_bouwjaar} onChange={e => set({ auto_bouwjaar: e.target.value })} placeholder="2015" /></div>
              <div><label className={L}>Geschatte dagwaarde</label><EuroInput value={state.auto_waarde} onChange={v => set({ auto_waarde: v })} /></div>
            </div>
            <div className={row2}>
              <div>
                <label className={L}>Reden noodzakelijk?</label>
                <select className="inp" value={state.auto_reden} onChange={e => set({ auto_reden: e.target.value })}>
                  <option value="">— Selecteer —</option>
                  <option value="werk">Werk / zakelijk</option>
                  <option value="medisch">Medische noodzaak</option>
                  <option value="mantelzorg">Mantelzorg</option>
                  <option value="kinderen">Vervoer kinderen</option>
                  <option value="geen">Geen bijzondere reden</option>
                </select>
              </div>
              <div>
                <label className={L}>Behoud / verkoop bij schuldregeling?</label>
                <ToggleWidget value={state.auto_verm} options={[{ v: 'behoud', l: 'Behouden' }, { v: 'verkoop', l: 'Verkopen' }, { v: 'nvb', l: 'Niet besproken' }]} onChange={v => set({ auto_verm: v })} />
                {autoNote && <div className="text-[0.7rem] mt-1" style={{ color: autoNote.color }}>{autoNote.msg}</div>}
              </div>
            </div>
            {autoAdv && <Alert variant="gold" icon={<BsCarFront />} title="Autowaarde >€3.000">{autoAdv}</Alert>}
          </div>
        )}

        {tot > 0 && (
          <Alert variant={tot > grens ? 'warn' : 'ok'} icon={tot > grens ? <HiExclamationTriangle /> : <HiOutlineCheckCircle />}
            title={tot > grens ? `Vermogen boven vrijstellingsgrens (€${nl(grens)})` : `Vermogen binnen vrijstellingsgrens (€${nl(grens)})`}>
            Totaal €{nl(tot)}.{tot > grens ? ` — €${nl(tot - grens)} te veel. Gevolgen voor bijstandsrecht.` : ''}
          </Alert>
        )}

        <hr className="border-rule my-3" />
        <div className={SL}>Verzekeringen</div>
        <p className="text-[0.77rem] text-inkl mb-3">Status bepaalt ook de adviesmelding en wordt gekoppeld aan de lasten op tabblad 07.</p>

        <div className={row3}>
          <div>
            <label className={L}>Aansprakelijkheidsverzekering (AVP)</label>
            <ToggleWidget value={state.tw_avp} options={TW_VERZ} onChange={v => set({ tw_avp: v })} />
          </div>
          <div>
            <label className={L}>Inboedelverzekering</label>
            <ToggleWidget value={state.tw_inboedel} options={TW_VERZ} onChange={v => set({ tw_inboedel: v })} />
          </div>
          {state.eigen_woning === 'ja' && (
            <div>
              <label className={L}>Opstalverzekering (koopwoning)</label>
              <ToggleWidget value={state.tw_opstal} options={TW_VERZ} onChange={v => set({ tw_opstal: v })} />
            </div>
          )}
        </div>
        <div className={row3}>
          <div>
            <label className={L}>Uitvaartverzekering</label>
            <ToggleWidget value={state.tw_uitvaart} options={TW_VERZ} onChange={v => set({ tw_uitvaart: v })} />
          </div>
          <div>
            <label className={L}>Aanvullende zorgverzekering</label>
            <ToggleWidget value={state.tw_zorgaanv} options={TW_VERZ_NVT} onChange={v => set({ tw_zorgaanv: v })} />
          </div>
          <div>
            <label className={L}>Wanbetalersregeling (CAK)</label>
            <ToggleWidget value={state.tw_wanbet} options={[{ v: 'ja', l: <div className="flex items-center gap-1"><HiCheck /> Ja</div> }, { v: 'nee', l: <div className="flex items-center gap-1"><HiXMark /> Nee</div> }]} onChange={v => set({ tw_wanbet: v })} />
            {state.tw_wanbet === 'ja' && (
              <Alert variant="warn" icon={<HiExclamationTriangle />} title="Wanbetalersregeling actief" className="mt-1">
                CAK-regeling actief. Noteer details in toelichting.
              </Alert>
            )}
          </div>
        </div>
        {verzSignalen.map((s, i) => <Alert key={i} variant={s.variant} icon={s.icon} title={s.title}>{s.msg}</Alert>)}

        <hr className="border-rule my-3" />
        <label className={L}>Toelichting op vermogen en verzekeringen</label>
        <textarea className="inp" rows={2} value={state.vermogen_toel} onChange={e => set({ vermogen_toel: e.target.value })} placeholder="Bijzonderheden: erfenis, geschillen, overig vermogen..." />
      </Card>

      <NavRow
        onBack={() => goTo(2)}
        backLabel={<><HiArrowLeft className="inline-block mr-1" /> Aanvraag</>}
        onNext={() => goTo(4)}
        nextLabel={<>Inkomen <HiArrowRight className="inline-block ml-1" /></>}
      />
    </div>
  )
}
