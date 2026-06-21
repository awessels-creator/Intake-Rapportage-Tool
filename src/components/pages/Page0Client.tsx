import { useForm } from '../../context'
import { NORM } from '../../constants'
import { lftd, lftdN, updArr, rmArr } from '../../utils'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import RadioGroup from '../shared/RadioGroup'
import Alert from '../shared/Alert'
import { HiUser, HiExclamationTriangle, HiOutlineBanknotes, HiXMark, HiArrowRight, HiOutlineAcademicCap, HiPlus } from 'react-icons/hi2'
import { MdOutlineElderly, MdChildCare } from 'react-icons/md'
import { useEffect } from 'react'

const L = 'block text-[.69rem] font-semibold text-inkl uppercase tracking-[.05em]'
const SL = 'text-[.69rem] font-semibold text-inkl uppercase tracking-[.05em] mt-[3px] mb-[7px] pb-[3px] border-b border-rule'
const row2 = 'grid grid-cols-2 gap-[11px] mb-[11px]'
const row3 = 'grid grid-cols-3 gap-[11px] mb-[11px]'
const row4 = 'grid grid-cols-4 gap-[11px] mb-[11px]'

export default function Page0Client() {
  const { state, set, goTo } = useForm()

  // Automatische leefsituatie-berekening op basis van leeftijden
  useEffect(() => {
    const clientAge = lftdN(state.geboortedatum)
    const partnerAge = lftdN(state.partner_geb)
    const hasPartner = state.heeft_partner === 'ja'

    if (clientAge < 21) return // jonger dan 21, geen automatische aanpassing

    let newLeefsituatie = ''
    const aowAge = 67

    if (hasPartner && partnerAge >= 21) {
      // Samenwonend
      if (clientAge >= aowAge && partnerAge >= aowAge) {
        newLeefsituatie = 'pensioen_paar'
      } else if (clientAge >= aowAge) {
        newLeefsituatie = 'pensioen_gemengd'
      } else {
        newLeefsituatie = 'samenwonend'
      }
    } else if (hasPartner && partnerAge > 0 && partnerAge < 21) {
      // Partner jonger dan 21
      newLeefsituatie = 'alleenstaand'
    } else if (!hasPartner) {
      // Alleenstaand
      if (clientAge >= aowAge) {
        newLeefsituatie = 'pensioen_alleen'
      } else {
        newLeefsituatie = 'alleenstaand'
      }
    }

    if (newLeefsituatie && newLeefsituatie !== state.leefsituatie) {
      const norm = NORM[newLeefsituatie]
      set({ leefsituatie: newLeefsituatie, ...(norm ? { bijstandsnorm: String(norm) } : {}) })
    }
  }, [state.geboortedatum, state.partner_geb, state.heeft_partner, state.leefsituatie, set])

  const isPensioen = state.leefsituatie.startsWith('pensioen')
  const age = lftdN(state.geboortedatum)

  const pensioenAlert = (() => {
    if (isPensioen) return null
    if (age >= 67) return 'Cliënt is waarschijnlijk 67+ (pensioengerechtigde). Overweeg leefsituatie aan te passen.'
    return null
  })()

  const partnerInconsistentie = (() => {
    const needsP = state.burgstaat === 'gehuwd' || state.burgstaat === 'geregistreerd' || state.burgstaat === 'samenwonend'
    return needsP && state.heeft_partner === 'nee'
  })()

  const kindAdv = state.kinderenData.filter(k => k.geb).map(k => {
    const a = lftdN(k.geb)
    if (a < 0) return null
    if (a < 4) return { icon: <MdChildCare />, naam: k.naam, a, msg: 'Check peuteropvang/VVE.', variant: 'info' as const }
    if (a < 12) return { icon: <HiOutlineAcademicCap />, naam: k.naam, a, msg: 'Check schoolkostenfonds, sport/cultuurregelingen.', variant: 'info' as const }
    if (a < 18) return { icon: <HiOutlineAcademicCap />, naam: k.naam, a, msg: 'OV-abonnement, schoolkosten, einde kinderbijslag bij 18e verjaardag.', variant: 'gold' as const }
    return null
  }).filter(Boolean)

  return (
    <div>
      <Card icon={<HiUser />} title="Cliëntgegevens">
        <div className={SL}>Persoonsgegevens</div>
        <div className={row4}>
          <div><label className={L}>Cliëntnummer</label><input className="inp" value={state.clientnr} onChange={e => set({ clientnr: e.target.value })} placeholder="GZ-2026-..." /></div>
          <div><label className={L}>Voornaam</label><input className="inp" value={state.voornaam} onChange={e => set({ voornaam: e.target.value })} /></div>
          <div><label className={L}>Achternaam</label><input className="inp" value={state.achternaam} onChange={e => set({ achternaam: e.target.value })} /></div>
          <div><label className={L}>Geboortedatum</label><input type="date" className="inp" value={state.geboortedatum} onChange={e => set({ geboortedatum: e.target.value })} /></div>
        </div>
        <div className={row3}>
          <div><label className={L}>BSN</label><input className="inp" value={state.bsn} maxLength={9} onChange={e => set({ bsn: e.target.value })} placeholder="000000000" /></div>
          <div>
            <label className={L}>Burgerlijke staat</label>
            <select className="inp" value={state.burgstaat} onChange={e => set({ burgstaat: e.target.value })}>
              <option value="">— Selecteer —</option>
              <option value="ongehuwd">Ongehuwd</option>
              <option value="gehuwd">Gehuwd</option>
              <option value="geregistreerd">Geregistreerd partnerschap</option>
              <option value="gescheiden">Gescheiden</option>
              <option value="weduwe">Weduwe/weduwnaar</option>
              <option value="samenwonend">Samenwonend (niet geregistreerd)</option>
            </select>
          </div>
          <div><label className={L}>Nationaliteit</label><input className="inp" value={state.nationaliteit} onChange={e => set({ nationaliteit: e.target.value })} placeholder="Bijv. Nederlands" /></div>
        </div>
        <div className={row2}>
          <div><label className={L}>Adres</label><input className="inp" value={state.adres} onChange={e => set({ adres: e.target.value })} placeholder="Straat en huisnummer" /></div>
          <div><label className={L}>Postcode + Woonplaats</label><input className="inp" value={state.woonplaats} onChange={e => set({ woonplaats: e.target.value })} placeholder="7940 AA Meppel" /></div>
        </div>
        <div className={row2}>
          <div><label className={L}>Telefoonnummer(s)</label><input className="inp" value={state.telefoon} onChange={e => set({ telefoon: e.target.value })} placeholder="06-00000000" /></div>
          <div><label className={L}>E-mail</label><input type="email" className="inp" value={state.email} onChange={e => set({ email: e.target.value })} /></div>
        </div>
        <div className={row2}>
          <div>
            <label className={L}>Leefsituatie / norm</label>
            <select className="inp" value={state.leefsituatie} onChange={e => {
              const ls = e.target.value
              const norm = NORM[ls]
              set({ leefsituatie: ls, ...(norm ? { bijstandsnorm: String(norm) } : {}) })
            }}>
              <option value="">— Selecteer —</option>
              <option value="alleenstaand">Alleenstaand (21+)</option>
              <option value="alleenstaande_ouder">Alleenstaande ouder (21+)</option>
              <option value="samenwonend">Samenwonend / Gehuwd</option>
              <option value="pensioen_alleen">Pensioengerechtigde — alleenstaand</option>
              <option value="pensioen_paar">Pensioengerechtigde — beiden AOW-gerechtigd</option>
              <option value="pensioen_gemengd">Pensioengerechtigde — partner jonger dan AOW-leeftijd</option>
            </select>
            {state.leefsituatie && NORM[state.leefsituatie] && (
              <div className="text-[0.67rem] text-accent mt-0.5 font-medium">
                Auto-ingevuld: €{NORM[state.leefsituatie].toLocaleString('nl-NL')} (jul 2026, aanpasbaar)
              </div>
            )}
          </div>
          <div><label className={L}>Datum intakegesprek</label><input type="date" className="inp" value={state.datum_intake} onChange={e => set({ datum_intake: e.target.value })} /></div>
        </div>

        {isPensioen && (
          <Alert variant="info" icon={<MdOutlineElderly />} title="Pensioengerechtigde">
            AOW-norm via SVB. IIT niet van toepassing (alleen voor niet-pensioengerechtigden). FDMA en kwijtschelding wel mogelijk indien inkomen ≤110% norm.
          </Alert>
        )}
        {pensioenAlert && (
          <Alert variant="gold" icon={<HiExclamationTriangle />} title="Cliënt is waarschijnlijk 67+ (pensioengerechtigde)">
            {pensioenAlert}
          </Alert>
        )}

        <hr className="border-rule my-[13px]" />

        <div className={SL}>Partner</div>
        <div className="mb-[11px]">
          <label className={L}>Partner aanwezig in de regeling?</label>
          <RadioGroup value={state.heeft_partner} options={[{ value: 'ja', label: 'Ja' }, { value: 'nee', label: 'Nee' }]} onChange={v => set({ heeft_partner: v })} />
        </div>

        {partnerInconsistentie && (
          <Alert variant="warn" icon={<HiExclamationTriangle />} title="Inconsistentie: burgerlijke staat vs. partner" className="mb-[11px]">
            Cliënt is gehuwd/geregistreerd maar partner staat op Nee. Controleer dit.
          </Alert>
        )}

        {state.heeft_partner === 'ja' && (
          <div>
            <div className={row4}>
              <div><label className={L}>Voornaam partner</label><input className="inp" value={state.partner_vnaam} onChange={e => set({ partner_vnaam: e.target.value })} /></div>
              <div><label className={L}>Achternaam partner</label><input className="inp" value={state.partner_anaam} onChange={e => set({ partner_anaam: e.target.value })} /></div>
              <div><label className={L}>Geboortedatum partner</label><input type="date" className="inp" value={state.partner_geb} onChange={e => set({ partner_geb: e.target.value })} /></div>
              <div><label className={L}>BSN partner</label><input className="inp" value={state.partner_bsn} maxLength={9} onChange={e => set({ partner_bsn: e.target.value })} placeholder="000000000" /></div>
            </div>
            <div className={row2}>
              <div>
                <label className={L}>Partner ook in de schuldhulpregeling?</label>
                <RadioGroup value={state.partner_reg} options={[{ value: 'ja', label: 'Ja' }, { value: 'nee', label: 'Nee' }]} onChange={v => set({ partner_reg: v })} />
              </div>
              {state.partner_reg === 'nee' && (
                <div><label className={L}>Reden partner niet in regeling</label><input className="inp" value={state.partner_niet_reden} onChange={e => set({ partner_niet_reden: e.target.value })} placeholder="Bijv. partner heeft eigen traject..." /></div>
              )}
            </div>
          </div>
        )}

        <hr className="border-rule my-[13px]" />

        <div className={SL}>Kinderen (thuiswonend)</div>
        <div className="mb-[11px]">
          <label className={L}>Thuiswonende kinderen &lt;18 jaar?</label>
          <RadioGroup value={state.kinderen} options={[{ value: 'ja', label: 'Ja' }, { value: 'nee', label: 'Nee' }]} onChange={v => {
            set({ kinderen: v, ...(v === 'ja' && state.kinderenData.length === 0 ? { kinderenData: [{ naam: '', geb: '', coouder: 'nee' }] } : {}) })
          }} />
        </div>

        {state.kinderen === 'ja' && (
          <div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Naam kind</th><th>Geboortedatum</th><th>Leeftijd</th><th>Co-ouderschap</th><th></th></tr></thead>
                <tbody>
                  {state.kinderenData.map((k, i) => (
                    <tr key={i}>
                      <td><input className="inp" value={k.naam} placeholder="Naam kind" onChange={e => set({ kinderenData: updArr(state.kinderenData, i, { naam: e.target.value }) })} /></td>
                      <td><input type="date" className="inp" value={k.geb} onChange={e => set({ kinderenData: updArr(state.kinderenData, i, { geb: e.target.value }) })} /></td>
                      <td className="text-[0.76rem] text-inkl whitespace-nowrap">{lftd(k.geb)}</td>
                      <td>
                        <select className="inp" value={k.coouder} onChange={e => set({ kinderenData: updArr(state.kinderenData, i, { coouder: e.target.value as 'ja' | 'nee' }) })}>
                          <option value="nee">Nee</option>
                          <option value="ja">Ja</option>
                        </select>
                      </td>
                      <td><button type="button" className="bg-none border-none text-warn text-[0.88rem] px-1 py-0.5 cursor-pointer" onClick={() => set({ kinderenData: rmArr(state.kinderenData, i) })}><HiXMark /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 mt-[7px] text-[0.75rem] text-inkl font-medium bg-warm border-[1.5px] border-dashed border-rule rounded-[5px] px-[11px] py-[5px] hover:border-accent hover:text-accent hover:bg-accents cursor-pointer"
              onClick={() => set({ kinderenData: [...state.kinderenData, { naam: '', geb: '', coouder: 'nee' }] })}
            >
              <HiPlus />
              Kind toevoegen
            </button>
            {kindAdv.map((adv, i) => adv && (
              <Alert key={i} variant={adv.variant} icon={adv.icon} title={`${adv.naam || 'Kind'} (${adv.a} jr)`}>{adv.msg}</Alert>
            ))}
            {state.kinderen === 'ja' && (
              <Alert variant="info" icon={<HiOutlineBanknotes />} title="Kinderalimentatie">
                Cliënt heeft kinderen — controleer of kinderalimentatie ontvangen wordt en of dit als inkomstenbron is meegenomen.
              </Alert>
            )}
          </div>
        )}
      </Card>

      <NavRow onNext={() => goTo(1)} nextLabel={<>Persoonlijk <HiArrowRight className="inline-block ml-1" /></>} />
    </div>
  )
}
