import { useForm } from '../../context'
import { TOESLAGEN, TOESLAG_NAMEN } from '../../constants'
import { getTotaalInkomen } from '../../utils'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import Alert from '../shared/Alert'
import { HiOutlineBuildingLibrary, HiOutlineBell, HiArrowLeft, HiArrowRight, HiXCircle, HiExclamationTriangle, HiCheck } from 'react-icons/hi2'
import { MdChildCare } from 'react-icons/md'

interface TsigProps { isKoop?: boolean; v: string; norm: number; ink: number; huurBdr: number }
function HuurSig({ isKoop, v, norm, ink, huurBdr }: TsigProps) {
  if (isKoop) return (
    <div className="flex items-center gap-1 text-[0.7rem] mt-1 text-warn-dark">
      <HiXCircle />
      <span>Koopwoning: geen recht op huurtoeslag</span>
    </div>
  )
  const val = parseFloat(v) || 0
  if (!val) return null
  if (val < 30 || val > 950) return (
    <div className="flex items-center gap-1 text-[0.7rem] mt-1 text-gold">
      <HiExclamationTriangle />
      <span>Ongebruikelijk (normaal €30–€950/mnd)</span>
    </div>
  )
  if (norm && ink > norm * 1.45) return (
    <div className="flex items-center gap-1 text-[0.7rem] mt-1 text-gold">
      <HiExclamationTriangle />
      <span>Inkomen lijkt te hoog voor huurtoeslag</span>
    </div>
  )
  if (huurBdr > 0 && val > huurBdr * 0.9) return (
    <div className="flex items-center gap-1 text-[0.7rem] mt-1 text-gold">
      <HiExclamationTriangle />
      <span>Huurtoeslag bijna gelijk aan huurprijs — klopt zelden</span>
    </div>
  )
  return (
    <div className="flex items-center gap-1 text-[0.7rem] mt-1 text-ok">
      <HiCheck />
      <span>Plausibel</span>
    </div>
  )
}

export default function Page5Toeslagen() {
  const { state, set, goTo } = useForm()

  const norm = parseFloat(state.bijstandsnorm) || 0
  const ink = getTotaalInkomen(state)
  const hK = state.kinderen === 'ja'
  const huurBdr = parseFloat(state.lastenWaarden['huur']?.bedrag || '0') || 0

  const toggle = (naam: string, checked: boolean) => {
    if (naam === 'huur' && checked && state.eigen_woning === 'ja') return
    set({
      toeslagenActief: { ...state.toeslagenActief, [naam]: checked },
    })
  }

  const setSig = (id: string): { ok: boolean; icon: React.ReactNode; msg: string } | null => {
    if (!state.toeslagenActief[id]) return null
    const v = parseFloat(state.toeslagenBedrag[id] || '0') || 0
    if (id === 'zorg') {
      if (!v) return null
      if (v < 10 || v > 165) return { ok: false, icon: <HiExclamationTriangle />, msg: 'Ongebruikelijk (normaal €10–€160/mnd)' }
      if (norm && ink > norm * 1.55) return { ok: false, icon: <HiExclamationTriangle />, msg: 'Inkomen lijkt te hoog' }
      return { ok: true, icon: <HiCheck />, msg: 'Plausibel' }
    }
    if (id === 'kinderbijslag') {
      if (!v) return null
      if (!hK) return { ok: false, icon: <HiExclamationTriangle />, msg: 'Kinderbijslag maar geen kinderen geregistreerd' }
      if (v < 80 || v > 900) return { ok: false, icon: <HiExclamationTriangle />, msg: 'Bedrag ongebruikelijk (normaal €80–€900/kwartaal)' }
      return { ok: true, icon: <HiCheck />, msg: 'Plausibel' }
    }
    if (id === 'kinderopvang') {
      if (!v) return null
      if (!hK) return { ok: false, icon: <HiExclamationTriangle />, msg: 'KOT maar geen kinderen' }
      return { ok: true, icon: <HiCheck />, msg: 'Geregistreerd' }
    }
    if (id === 'kindgebonden') {
      if (!v) return null
      if (!hK) return { ok: false, icon: <HiExclamationTriangle />, msg: 'WKB maar geen kinderen' }
      if (norm && ink > norm * 1.6) return { ok: false, icon: <HiExclamationTriangle />, msg: 'Inkomen lijkt te hoog voor WKB' }
      return { ok: true, icon: <HiCheck />, msg: 'Geregistreerd' }
    }
    if (id === 'overig_ink') {
      if (!v) return null
      return { ok: true, icon: <HiCheck />, msg: 'Geregistreerd' }
    }
    return null
  }

  return (
    <div>
      <Card icon={<HiOutlineBuildingLibrary />} title="Toeslagen">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TOESLAGEN.map(naam => {
            const actief = state.toeslagenActief[naam] || false
            const bedrag = state.toeslagenBedrag[naam] || ''
            const beslag = state.toeslagenBeslag[naam] || false
            const isKoop = naam === 'huur' && state.eigen_woning === 'ja'
            const sig = setSig(naam)

            return (
              <div key={naam} className={`border rounded-lg p-3 transition-colors ${actief ? 'border-accent bg-accents' : 'border-rule bg-white'}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={actief}
                    className="accent-accent w-3.5 h-3.5"
                    onChange={e => toggle(naam, e.target.checked)}
                  />
                  <span className="text-[0.82rem] font-medium text-ink">{TOESLAG_NAMEN[naam]}</span>
                </label>

                {actief && (
                  <div className="mt-2">
                    {naam === 'overig_ink' && (
                      <input
                        className="inp mb-1.5"
                        placeholder="Omschrijving (bijv. Toeslag UWV)"
                        value={state.toeslagenNaam['overig_ink'] || ''}
                        onChange={e => set({ toeslagenNaam: { ...state.toeslagenNaam, overig_ink: e.target.value } })}
                      />
                    )}
                    <div className="relative">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-inkl text-[0.76rem] pointer-events-none">€</span>
                      <input
                        type="number"
                        className="inp"
                        style={{ paddingLeft: 16 }}
                        placeholder={naam === 'kinderbijslag' ? 'Bedrag/kwartaal' : 'Bedrag/mnd'}
                        value={bedrag}
                        onChange={e => set({ toeslagenBedrag: { ...state.toeslagenBedrag, [naam]: e.target.value } })}
                      />
                    </div>
                    {naam !== 'kinderbijslag' && (
                      <label className="flex items-center gap-1.5 mt-1.5 text-[0.7rem] text-inkl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={beslag}
                          className="accent-warn w-3 h-3"
                          onChange={e => set({ toeslagenBeslag: { ...state.toeslagenBeslag, [naam]: e.target.checked } })}
                        />
                        Beslag gelegd op deze toeslag
                      </label>
                    )}
                    {naam === 'huur' && (
                      <HuurSig isKoop={isKoop} v={bedrag} norm={norm} ink={ink} huurBdr={huurBdr} />
                    )}
                    {sig && (
                      <div className={`flex items-center gap-1 text-[0.7rem] mt-1 ${sig.ok ? 'text-ok' : 'text-gold'}`}>
                        {sig.icon}
                        <span>{sig.msg}</span>
                      </div>
                    )}
                  </div>
                )}
                {naam === 'huur' && !actief && isKoop && (
                  <div className="flex items-center gap-1 text-[0.69rem] text-warn-dark mt-1">
                    <HiXCircle />
                    <span>Koopwoning — geen recht op huurtoeslag</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {hK && !state.toeslagenActief['kinderopvang'] && (
          <Alert variant="gold" icon={<HiOutlineBell />} title="KOT niet geregistreerd" className="mt-2">
            Vraag na of kinderopvang wordt gebruikt.
          </Alert>
        )}
        {hK && !state.toeslagenActief['kinderbijslag'] && (
          <Alert variant="info" icon={<MdChildCare />} title="Kinderbijslag (AKW) niet geregistreerd" className="mt-2">
            Controleer SVB.
          </Alert>
        )}
      </Card>

      <NavRow
        onBack={() => goTo(4)}
        backLabel={<><HiArrowLeft className="inline-block mr-1" /> Inkomen</>}
        onNext={() => goTo(6)}
        nextLabel={<>Vaste Lasten <HiArrowRight className="inline-block ml-1" /></>}
      />
    </div>
  )
}
