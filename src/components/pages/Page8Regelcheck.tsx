import { useForm } from '../../context'
import { useNormen } from '../../context/NormContext'
import { TOESLAG_GRENZEN_2026 } from '../../constants'
import { getTotaalInkomen, getTotaalLasten, yearsSince } from '../../utils'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import Alert from '../shared/Alert'
import { HiOutlineMagnifyingGlass, HiArrowLeft, HiArrowRight, HiXMark, HiCheck, HiQuestionMarkCircle, HiMiniXCircle, HiOutlineFaceSmile } from 'react-icons/hi2'
import { MdOutlineHandshake } from 'react-icons/md'
import { evaluateRegelingen, geenEigenAanslag, isJeugdOfInstelling, lftdN } from '../../utils'
import type { RegelingVoorstel } from '../../utils'

const L = 'block text-[.76rem] text-inkl mb-0.5 font-medium'
const row2 = 'grid grid-cols-2 gap-3 mb-3'

function VoorstelBadge({ v }: { v: RegelingVoorstel }) {
  const map = {
    ja: { cls: 'bg-oks text-ok-dark', icon: <HiCheck />, label: 'Voorstel: recht op' },
    nee: { cls: 'bg-warns text-warn-dark', icon: <HiMiniXCircle />, label: 'Voorstel: geen recht' },
    check: { cls: 'bg-golds text-gold-dark', icon: <HiQuestionMarkCircle />, label: 'Controleren' },
    nvt: { cls: 'bg-gray-100 text-inkl', icon: <HiXMark />, label: 'N.v.t.' },
  }[v.recht]
  return (
    <div className={`flex items-start gap-1.5 rounded-md px-2 py-1 mb-1.5 text-[0.72rem] font-medium ${map.cls}`}>
      <span className="mt-0.5">{map.icon}</span>
      <span><span className="font-semibold">{map.label}:</span> {v.reden}</span>
    </div>
  )
}

type Indicatie = 'ja' | 'nee' | 'twijfel' | 'nvt'

interface Regel {
  n: string
  norm: string
  sit: string
  r: Indicatie
  t: string | React.ReactNode
}

export default function Page8Regelcheck() {
  const { state, set, goTo } = useForm()
  const { VGRENS } = useNormen()

  const norm = parseFloat(state.bijstandsnorm) || 0
  const ink = getTotaalInkomen(state)
  const ls = state.leefsituatie
  const isPensioen = ls.startsWith('pensioen')
  const isJeugdInst = isJeugdOfInstelling(ls)
  const leeftijd8 = lftdN(state.geboortedatum)
  const onder21 = leeftijd8 >= 0 && leeftijd8 < 21
  const hK = state.kinderen === 'ja'
  const pct = norm ? (ink / norm) * 100 : 0
  const sp = (parseFloat(state.spaargeld) || 0) + (parseFloat(state.overig_verm) || 0) + (parseFloat(state.beleggingen) || 0)
  const grens = VGRENS[ls] || 8000
  const geenAanslag = geenEigenAanslag(state)
  const tot = getTotaalLasten(state)
  const best = ink - tot
  const jaarGrensHuur = TOESLAG_GRENZEN_2026['huur'] ? (ls === 'samenwonend' || ls === 'alleenstaande_ouder' ? TOESLAG_GRENZEN_2026['huur'].samen : TOESLAG_GRENZEN_2026['huur'].alleen) : 0
  const huurBdr = parseFloat(state.lastenWaarden['huur']?.bedrag || '0') || 0
  const beoordeling = evaluateRegelingen(state)

  const iitJr = yearsSince(state.iit_datum)
  const iitDatumOntbreekt = iitJr === null

  const regels: Regel[] = [
    {
      n: 'Aanvullende bijstand / AIO',
      norm: `< €${norm.toLocaleString('nl-NL')}/mnd`,
      sit: `${pct.toFixed(0)}% van norm`,
      r: norm && ink ? pct < 100 ? 'ja' : 'nee' : 'twijfel',
      t: pct < 100 ? 'Inkomen onder norm — aanvraag gemeente of SVB (pensioengerechtigden)' : 'Inkomen op of boven norm',
    },
    {
      n: 'Individuele Inkomenstoeslag (IIT)',
      norm: '3 jr ≤105% norm; niet voor pensioengerechtigden',
      sit: isPensioen ? 'Pensioengerechtigde' : `${pct.toFixed(0)}%`,
      r: (isPensioen || onder21 || isJeugdInst) ? 'nvt' : !norm || !ink ? 'twijfel' : pct >= 105 ? 'nee' : iitDatumOntbreekt ? 'twijfel' : iitJr >= 3 ? 'ja' : 'twijfel',
      t: (isPensioen || onder21 || isJeugdInst) ? 'N.v.t. (niet voor pensioengerechtigden, jeugd <21 of instelling)' : pct >= 105 ? 'Inkomen boven 105%' : iitDatumOntbreekt ? 'Startdatum IIT niet ingevuld bij Inkomen — invullen om termijn te bepalen' : iitJr >= 3 ? <div className="flex items-center gap-1"><HiCheck className="text-ok" /> 3 jaar bereikt — aanvragen!</div> : `${iitJr.toFixed(1)} jr — nog ${(3 - iitJr).toFixed(1)} jr te gaan`,
    },
    {
      n: 'Kwijtschelding GBLT',
      norm: '< 120% norm, vermogen binnen grens',
      sit: `${pct.toFixed(0)}%`,
      r: geenAanslag ? 'nvt' : norm && ink ? pct < 120 && sp <= grens ? 'ja' : pct >= 120 ? 'nee' : 'twijfel' : 'twijfel',
      t: geenAanslag ? 'Geen eigen belastingaanslag (woont bij ouders / instelling) — n.v.t.' : pct >= 120 ? 'Inkomen ≥120%' : sp > grens ? 'Vermogen boven grens' : 'Voldoet — aanvragen bij GBLT',
    },
    {
      n: 'Kwijtschelding gemeentelijke belastingen',
      norm: '< 120% norm, vermogen binnen grens',
      sit: `${pct.toFixed(0)}%`,
      r: geenAanslag ? 'nvt' : norm && ink ? pct < 120 && sp <= grens ? 'ja' : pct >= 120 ? 'nee' : 'twijfel' : 'twijfel',
      t: geenAanslag ? 'Geen eigen belastingaanslag (woont bij ouders / instelling) — n.v.t.' : pct >= 120 ? 'Inkomen ≥120%' : 'Aanvragen bij gemeente Meppel',
    },
    {
      n: 'Huurtoeslag',
      norm: 'Huurwoning, inkomen < inkomensgrens, huur binnen bandbreedte',
      sit: state.eigen_woning === 'ja' ? 'Koopwoning' : jaarGrensHuur ? `Inkomen €${Math.round(ink).toLocaleString('nl-NL')} / grens €${jaarGrensHuur.toLocaleString('nl-NL')} / huur €${Math.round(huurBdr).toLocaleString('nl-NL')}` : `${pct.toFixed(0)}%`,
      r: state.eigen_woning === 'ja' ? 'nvt' : norm && ink ? (
        jaarGrensHuur && ink > jaarGrensHuur ? 'twijfel'
          : huurBdr > 0 && huurBdr < 30 ? 'nee'
          : huurBdr > 950 ? 'twijfel'
          : huurBdr === 0 ? 'twijfel'
          : 'ja'
      ) : 'twijfel',
      t: state.eigen_woning === 'ja' ? 'Koopwoning — geen recht'
        : jaarGrensHuur && ink > jaarGrensHuur ? `Inkomen boven grens huurtoeslag (€${jaarGrensHuur.toLocaleString('nl-NL')}/jr, bij benadering — controleer Proefberekening Belastingdienst)`
        : huurBdr > 0 && huurBdr < 30 ? 'Huur te laag (<€30/mnd) — geen recht op huurtoeslag, controleer huurbedrag'
        : huurBdr > 950 ? 'Huur onrealistisch hoog (>€950/mnd) — controleer huurbedrag'
        : huurBdr === 0 ? 'Huurbedrag niet ingevuld — vul de huur in voor een juiste beoordeling'
        : 'Inkomen onder grens en huur binnen bandbreedte — controleer Belastingdienst voor exacte hoogte',
    },
    {
      n: 'Zorgtoeslag',
      norm: 'Laag/midden inkomen',
      sit: `${pct.toFixed(0)}%`,
      r: norm && ink ? pct < 150 ? 'ja' : 'twijfel' : 'twijfel',
      t: 'Controleer Belastingdienst',
    },
    {
      n: 'Kindgebonden budget (WKB)',
      norm: 'Kinderen <18 jr, laag inkomen',
      sit: hK ? `Ja; ${pct.toFixed(0)}%` : 'Geen kinderen',
      r: hK ? pct < 130 ? 'ja' : 'twijfel' : 'nvt',
      t: hK ? 'Controleer Belastingdienst' : 'Geen kinderen — n.v.t.',
    },
    {
      n: 'Voedselbank Meppel',
      norm: 'Structureel besteedbaar tekort',
      sit: ink > 0 && tot > 0 ? best < 0 ? `Tekort €${Math.abs(best).toFixed(0)}/mnd` : best < 100 ? `Krap €${best.toFixed(0)}/mnd` : `€${best.toFixed(0)}/mnd` : '—',
      r: ink > 0 && tot > 0 ? best < 0 ? 'ja' : best < 100 ? 'twijfel' : 'nee' : 'twijfel',
      t: 'Aanmelding via gemeente of direct bij voedselbank Meppel',
    },
  ]

  const chipCls = { ja: 'chip chip-ja', nee: 'chip chip-nee', twijfel: 'chip chip-twijfel', nvt: 'chip chip-nvt' }
  const chipTxt: Record<Indicatie, React.ReactNode> = {
    ja: <div className="flex items-center gap-1"><HiCheck /> <span>Waarsch. recht</span></div>,
    nee: <div className="flex items-center gap-1"><HiXMark /> <span>Geen recht</span></div>,
    twijfel: <div className="flex items-center gap-1"><HiQuestionMarkCircle /> <span>Controleren</span></div>,
    nvt: <span>N.v.t.</span>
  }

  const fdmaAlert = (() => {
    if (!pct) return null
    if (pct < 110) return { variant: 'ok' as const, icon: <HiOutlineFaceSmile />, msg: `FDMA — cliënt heeft hier waarschijnlijk recht op (${pct.toFixed(0)}% norm <110%). Aanvragen bij gemeente Meppel als nog niet gedaan.` }
    if (pct >= 110) return { variant: 'warn' as const, icon: <HiXMark />, msg: `FDMA — inkomen te hoog (${pct.toFixed(0)}% ≥110%). Geen recht op FDMA op basis van huidig inkomen.` }
    return null
  })()

  return (
    <div>
      <Card icon={<HiOutlineMagnifyingGlass />} title="Regelcheck — Indicatieve rechtencheck">
        <p className="text-[0.79rem] text-inkl mb-3">
          Indicatief op basis van ingevulde gegevens. Definitief recht berust altijd bij de betreffende instantie.
        </p>
        <div className="overflow-x-auto">
          <table className="rct">
            <thead>
              <tr><th>Regeling</th><th>Norm 2026</th><th>Situatie cliënt</th><th>Indicatie</th><th>Toelichting</th></tr>
            </thead>
            <tbody>
              {regels.map(r => (
                <tr key={r.n}>
                  <td><strong className="text-[0.79rem]">{r.n}</strong></td>
                  <td className="text-[0.7rem] text-inkl" dangerouslySetInnerHTML={{ __html: r.norm }} />
                  <td className="text-[0.7rem]">{r.sit}</td>
                  <td><span className={chipCls[r.r]}>{chipTxt[r.r]}</span></td>
                  <td className="text-[0.7rem] text-inkl">{r.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr className="border-rule my-3" />
        <div className="text-[0.67rem] font-semibold text-inkl uppercase tracking-widest mb-2 pb-1 border-b border-rule">Gemeentelijke regelingen Meppel</div>

        {fdmaAlert && <Alert variant={fdmaAlert.variant} icon={fdmaAlert.icon} className="mb-3">{fdmaAlert.msg} <a href="https://www.meppel.nl/direct-regelen/ondersteuning-jeugd-en-inkomen/fonds-deelname-maatschappelijke-activiteiten/" target="_blank" rel="noreferrer" className="underline text-accent">Meer over FDMA →</a></Alert>}

        <div className={row2}>
          <div>
            <VoorstelBadge v={beoordeling.fdma} />
            <label className={L}>FDMA aangevraagd?</label>
            <select className="inp" value={state.fdma} onChange={e => set({ fdma: e.target.value })}>
              <option value="">— Onbekend —</option>
              <option value="ja">Ja, actief</option>
              <option value="nee">Nee</option>
              <option value="nvt">N.v.t.</option>
            </select>
            <div className="text-[0.7rem] text-inkl mt-0.5">Fonds Deelname Maatschappelijke Activiteiten — &lt;110% norm. <a href="https://www.meppel.nl/direct-regelen/ondersteuning-jeugd-en-inkomen/fonds-deelname-maatschappelijke-activiteiten/" target="_blank" rel="noreferrer" className="underline text-accent">Criteria &amp; aanvraag</a></div>
          </div>
          <div>
            <VoorstelBadge v={beoordeling.kwijtschelding_gblt} />
            <label className={L}>Kwijtschelding GBLT?</label>
            <select className="inp" value={state.kwgt} onChange={e => set({ kwgt: e.target.value })}>
              <option value="">— Onbekend —</option>
              <option value="ja">Aangevraagd</option>
              <option value="ok">Gehonoreerd</option>
              <option value="af">Afgewezen</option>
              <option value="nee">Niet aangevraagd</option>
            </select>
          </div>
        </div>
        <div className={row2}>
          <div>
            <VoorstelBadge v={beoordeling.kwijtschelding_gemeente} />
            <label className={L}>Kwijtschelding gemeentelijke belastingen?</label>
            <select className="inp" value={state.kwgm} onChange={e => set({ kwgm: e.target.value })}>
              <option value="">— Onbekend —</option>
              <option value="ja">Aangevraagd</option>
              <option value="ok">Gehonoreerd</option>
              <option value="af">Afgewezen</option>
              <option value="nee">Niet aangevraagd</option>
            </select>
          </div>
          <div>
            <VoorstelBadge v={beoordeling.kindsupport} />
            <label className={L}>Kindsupport Meppel</label>
            <select className="inp" value={state.kindsupport} onChange={e => set({ kindsupport: e.target.value })}>
              <option value="">— Onbekend —</option>
              <option value="ja">Ja, actief gebruik</option>
              <option value="aanvragen">Aanvragen aanbevolen</option>
              <option value="nee">Niet van toepassing</option>
            </select>
            <div className="text-[0.7rem] text-inkl mt-0.5">Ondersteuning gezinnen met kinderen Meppel. <a href="https://kindsupportmeppel.nl/" target="_blank" rel="noreferrer" className="underline text-accent">kindsupportmeppel.nl</a></div>
          </div>
        </div>

        <Alert variant="purp" icon={<MdOutlineHandshake />} title="Kindsupport Meppel — altijd bespreken!" className="mb-3">
          Ondersteuning voor gezinnen met kinderen in Meppel. Vraag altijd na of cliënt hier gebruik van (kan) maken en leg vast. <a href="https://kindsupportmeppel.nl/" target="_blank" rel="noreferrer" className="underline text-accent">Meer info →</a>
        </Alert>

        <div className={row2}>
          <div>
            <VoorstelBadge v={beoordeling.voedselbank} />
            <label className={L}>Voedselbank?</label>
            <select className="inp" value={state.voedselbank} onChange={e => set({ voedselbank: e.target.value })}>
              <option value="">— Onbekend —</option>
              <option value="ja">Ja, actief gebruik</option>
              <option value="aanvragen">Aanvragen aanbevolen</option>
              <option value="nee">Nee</option>
            </select>
            <div className="text-[0.7rem] text-inkl mt-0.5">Criteria: besteedbaar inkomen voor voeding+kleding onder norm (1-persoon €400, +€120 p.p.). <a href="https://voedselbankzuidwestdrenthe.nl/voedselhulp-aanvragen/criteria-voedselhulp/" target="_blank" rel="noreferrer" className="underline text-accent">Criteria voedselhulp</a></div>
          </div>
        </div>
      </Card>

      <NavRow
        onBack={() => goTo(7)}
        backLabel={<><HiArrowLeft className="inline-block mr-1" /> Schulden</>}
        onNext={() => goTo(9)}
        nextLabel={<>Advies <HiArrowRight className="inline-block ml-1" /></>}
      />
    </div>
  )
}
