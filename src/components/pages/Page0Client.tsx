import { useForm } from '../../context'
import { useNormen } from '../../context/NormContext'
import { lftd, lftdN, updArr, rmArr, bsn11Proef, isJeugdOfInstelling } from '../../utils'
import Card from '../shared/Card'
import NavRow from '../shared/NavRow'
import RadioGroup from '../shared/RadioGroup'
import Alert from '../shared/Alert'
import { HiUser, HiExclamationTriangle, HiOutlineBanknotes, HiXMark, HiArrowRight, HiOutlineAcademicCap, HiPlus, HiArrowUpTray } from 'react-icons/hi2'
import { MdOutlineElderly, MdChildCare } from 'react-icons/md'
import { useEffect, useState } from 'react'
import { useDocxUpload } from '../../hooks/useDocxUpload'

const L = 'block text-[.69rem] font-semibold text-inkl uppercase tracking-[.05em]'
const SL = 'text-[.69rem] font-semibold text-inkl uppercase tracking-[.05em] mt-[3px] mb-[7px] pb-[3px] border-b border-rule'
const row2 = 'grid grid-cols-2 gap-[11px] mb-[11px]'
const row3 = 'grid grid-cols-3 gap-[11px] mb-[11px]'
const row4 = 'grid grid-cols-4 gap-[11px] mb-[11px]'

export default function Page0Client() {
  const { state, set, goTo, resetKey } = useForm()
  const { NORM, NORMPERIODE } = useNormen()

  const { openFilePicker, uploadState, resetUploadState } = useDocxUpload()
  const [plakTekst, setPlakTekst] = useState('')
  const [plakFout, setPlakFout] = useState<string | null>(null)
  const [plakSucces, setPlakSucces] = useState(false)
  const [toonJeugdModal, setToonJeugdModal] = useState(false)
  const [toonPensioenModal, setToonPensioenModal] = useState(false)

  // Reset modals bij sessie-wissen
  useEffect(() => {
    setToonJeugdModal(false)
    setToonPensioenModal(false)
  }, [resetKey])

  const verwerkPlakTekst = () => {
    setPlakFout(null)
    setPlakSucces(false)
    if (!plakTekst.trim()) {
      setPlakFout('Plak eerst je tekst hierboven.')
      return
    }
    const tekst = plakTekst
    const result: Record<string, string> = {}

    // Split in regels en verwijder lege regels
    const regels = tekst.split(/[\n\r]+/).map((r: string) => r.trim()).filter(Boolean)

    // Bekende labels in het rapport (alleen echte labels, geen waarden)
    const labels = new Set([
      'cliëntnr', 'cliënt nr', 'clientnr',
      'naam', 'voornaam', 'geb. datum', 'geboortedatum',
      'adres/postcode', 'adres', 'postcode',
      'woonplaats', 'burg. staat', 'burgerlijke staat',
      'nationaliteit', 'bsn',
      'telefoonnummer(s)', 'telefoonnummer', 'telefoon',
      'e-mail', 'email',
      'contactgegevens', 'contactgegevens:'
    ])

    const isLabel = (regel: string) => {
      const r = regel.toLowerCase().trim()
      for (const label of labels) {
        if (r === label || r.startsWith(label)) return true
      }
      return false
    }

    // Zoek naar label-waarde paren
    for (let i = 0; i < regels.length; i++) {
      const regel = regels[i]
      const regelLower = regel.toLowerCase()

      // Cliëntnummer
      if (regelLower.startsWith('cliëntnr') || regelLower.startsWith('cliënt nr') || regelLower.startsWith('clientnr')) {
        const val = regel.replace(/^[^\d]*/, '').trim()
        if (val) {
          result.clientnr = val
        } else if (i + 1 < regels.length && !isLabel(regels[i + 1])) {
          result.clientnr = regels[i + 1].trim()
        }
      }
      // Naam (voorletters + achternaam)
      else if (regelLower === 'naam' && i + 1 < regels.length && !isLabel(regels[i + 1])) {
        result.achternaam = regels[i + 1].trim()
      }
      // Voornamen
      else if (regelLower === 'voornaam' && i + 1 < regels.length && !isLabel(regels[i + 1])) {
        result.voornaam = regels[i + 1].trim()
      }
      // Geboortedatum - meerdere formaten ondersteunen
      else if ((regelLower.startsWith('geb') || regelLower.includes('geboorte')) && (regelLower.includes('datum') || regelLower.includes('date')) && i + 1 < regels.length && !isLabel(regels[i + 1])) {
        const rawDate = regels[i + 1].trim()
        // Converteer DD-MM-YYYY naar YYYY-MM-DD voor <input type="date">
        const parts = rawDate.split(/[./-]/)
        if (parts.length === 3) {
          const [d, m, y] = parts
          result.geboortedatum = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        } else {
          result.geboortedatum = rawDate
        }
      }
      // Adres/postcode
      else if (regelLower.startsWith('adres') && i + 1 < regels.length && !isLabel(regels[i + 1])) {
        result.adres = regels[i + 1].trim()
      }
      // Woonplaats
      else if (regelLower === 'woonplaats' && i + 1 < regels.length && !isLabel(regels[i + 1])) {
        result.woonplaats = regels[i + 1].trim()
      }
      // Burgerlijke staat
      else if (regelLower.startsWith('burg') && i + 1 < regels.length && !isLabel(regels[i + 1])) {
        const val = regels[i + 1].trim().toLowerCase()
        if (val.includes('ongehuwd')) result.burgstaat = 'ongehuwd'
        else if (val.includes('gehuwd')) {
          result.burgstaat = 'gehuwd'
          if (val.includes('gemeenschap van goederen') || val.includes('gvg')) result.huwelijksvoorwaarden = 'gvg'
          else if (val.includes('huwelijksvoorwaarden') || val.includes('huw.vw')) result.huwelijksvoorwaarden = 'huw.vw'
        }
        else if (val.includes('geregistreerd')) {
          result.burgstaat = 'geregistreerd'
          if (val.includes('partnerschapsvoorwaarden')) result.huwelijksvoorwaarden = 'partnerschapsvoorwaarden'
        }
        else if (val.includes('gescheiden')) result.burgstaat = 'gescheiden'
        else if (val.includes('samenwonend')) result.burgstaat = 'samenwonend'
        else if (val.includes('weduwe') || val.includes('weduwnaar')) result.burgstaat = 'weduwe'
        else result.burgstaat = regels[i + 1].trim()
      }
      // Nationaliteit
      else if (regelLower === 'nationaliteit' && i + 1 < regels.length && !isLabel(regels[i + 1])) {
        result.nationaliteit = regels[i + 1].trim()
      }
      // BSN
      else if (regelLower === 'bsn' && i + 1 < regels.length && !isLabel(regels[i + 1])) {
        result.bsn = regels[i + 1].trim().replace(/\D/g, '')
      }
      // Telefoonnummer(s)
      else if (regelLower.startsWith('telefoon') && i + 1 < regels.length && !isLabel(regels[i + 1])) {
        result.telefoon = regels[i + 1].trim()
      }
      // E-mail
      else if (regelLower.includes('mail') && i + 1 < regels.length && !isLabel(regels[i + 1])) {
        result.email = regels[i + 1].trim()
      }
    }

    const veldenGevuld = Object.keys(result).length
    if (veldenGevuld === 0) {
      setPlakFout('Geen herkenbare velden gevonden. Controleer of je het hele rapport hebt gekopieerd.')
      return
    }

    set(result)
    setPlakSucces(true)
    setPlakTekst('')
  }


  // Automatische leefsituatie-berekening op basis van leeftijden en burgstaat
  useEffect(() => {
    const clientAge = lftdN(state.geboortedatum)
    const partnerAge = lftdN(state.partner_geb)
    const hasPartner = state.heeft_partner === 'ja'
    const isGehuwdOfGeregistreerd = state.burgstaat === 'gehuwd' || state.burgstaat === 'geregistreerd'
    const aowAge = 67

    let newLeefsituatie = ''

    if (clientAge >= 0 && clientAge < 21 && !(hasPartner && partnerAge >= 21)) {
      // Jeugdige <21 zonder meerderjarige partner - toon modal
      if (state.leefsituatie !== 'jeugd_thuis' && state.leefsituatie !== 'jeugd_zelfstandig' && state.leefsituatie !== 'instelling') {
        setToonJeugdModal(true)
      }
      return
    } else if (hasPartner || isGehuwdOfGeregistreerd) {
      // Samenwonend / Gehuwd / Geregistreerd partnerschap
      if (clientAge >= aowAge && partnerAge >= aowAge) {
        newLeefsituatie = 'pensioen_paar'
      } else if (clientAge >= aowAge) {
        newLeefsituatie = 'pensioen_gemengd'
      } else {
        newLeefsituatie = 'samenwonend'
      }
    } else {
      // Alleenstaand
      newLeefsituatie = clientAge >= aowAge ? 'pensioen_alleen' : 'alleenstaand'
    }

    if (newLeefsituatie && newLeefsituatie !== state.leefsituatie) {
      // Toon pensioen-modal bij gehuwd/geregistreerd met AOW-gerechtigde
      if ((state.burgstaat === 'gehuwd' || state.burgstaat === 'geregistreerd') && 
          (newLeefsituatie === 'pensioen_gemengd' || newLeefsituatie === 'pensioen_paar')) {
        setToonPensioenModal(true)
        return
      }
      const norm = NORM[newLeefsituatie]
      set({ leefsituatie: newLeefsituatie, ...(norm ? { bijstandsnorm: String(norm) } : {}) })
    }
  }, [state.geboortedatum, state.partner_geb, state.heeft_partner, state.burgstaat, state.woont_bij, set])

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
      {/* Plak-sectie */}
      <Card icon={<HiArrowUpTray />} title="Plak cliëntgegevens uit je rapport">
        <p className="text-[0.75rem] text-inkl mb-2">Kopieer het cliëntgegevens-blok uit je rapport/notities Geldzorgen en plak het hier. De tool vult alles automatisch in.</p>
        <textarea
          value={plakTekst}
          onChange={e => { setPlakTekst(e.target.value); setPlakSucces(false); setPlakFout(null); }}
          placeholder=""
          className="w-full h-32 p-3 border border-rule rounded-[8px] text-[0.8rem] resize-y"
        />
        <button
          type="button"
          onClick={verwerkPlakTekst}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-[0.77rem] font-medium rounded-md border border-rule text-inkl bg-transparent hover:bg-accents transition-all duration-150 cursor-pointer"
        >
          <HiArrowUpTray className="text-[0.9rem]" />
          Verwerk gegevens
        </button>
        {plakFout && (
          <p className="text-[0.75rem] text-warn mt-2 flex items-center gap-1"><HiExclamationTriangle /> {plakFout}</p>
        )}
        {plakSucces && (
          <p className="text-[0.75rem] text-ok mt-2">✓ Gegevens verwerkt! Klik op 'Cliëntgegevens' om te controleren.</p>
        )}
      </Card>

      {/* Jeugd-melding */}
      {toonJeugdModal && (
        <Alert variant="warn" icon={<HiExclamationTriangle />} title="Jeugdige &lt;21 — waar woont deze persoon?">
          <div className="grid grid-cols-3 gap-2 mt-2">
            <button type="button" className="bg-warns border border-warn-border rounded-[6px] px-3 py-2 text-sm font-medium text-warn-dark cursor-pointer hover:bg-warn-border transition-colors" onClick={() => { set({ leefsituatie: 'jeugd_thuis', woont_bij: 'ouders' }); setToonJeugdModal(false) }}>
              Thuis bij ouders
            </button>
            <button type="button" className="bg-warns border border-warn-border rounded-[6px] px-3 py-2 text-sm font-medium text-warn-dark cursor-pointer hover:bg-warn-border transition-colors" onClick={() => { set({ leefsituatie: 'jeugd_zelfstandig', woont_bij: 'zelf' }); setToonJeugdModal(false) }}>
              Zelfstandig wonend
            </button>
            <button type="button" className="bg-warns border border-warn-border rounded-[6px] px-3 py-2 text-sm font-medium text-warn-dark cursor-pointer hover:bg-warn-border transition-colors" onClick={() => { set({ leefsituatie: 'instelling', woont_bij: 'instelling' }); setToonJeugdModal(false) }}>
              Instelling
            </button>
          </div>
        </Alert>
      )}

      {/* Pensioen-modal */}
      {toonPensioenModal && (
        <Alert variant="info" icon={<MdOutlineElderly />} title="Pensioengerechtigde met partner">
          <p className="text-sm mb-3">De cliënt is pensioengerechtigd en heeft een partner. Is de partner ook pensioengerechtigd (AOW-leeftijd) of jonger?</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="bg-infos border border-info-border rounded-[6px] px-3 py-2 text-sm font-medium text-info-text cursor-pointer hover:bg-info-border transition-colors" onClick={() => { set({ leefsituatie: 'pensioen_paar', bijstandsnorm: String(NORM['pensioen_paar'] || '') }); setToonPensioenModal(false) }}>
              Partner is ook AOW-gerechtigd
            </button>
            <button type="button" className="bg-infos border border-info-border rounded-[6px] px-3 py-2 text-sm font-medium text-info-text cursor-pointer hover:bg-info-border transition-colors" onClick={() => { set({ leefsituatie: 'pensioen_gemengd', bijstandsnorm: String(NORM['pensioen_gemengd'] || '') }); setToonPensioenModal(false) }}>
              Partner is jonger dan AOW-leeftijd
            </button>
          </div>
        </Alert>
      )}

      {/* Upload-sectie */}
      <Card icon={<HiArrowUpTray />} title="Eerder gewerkt?">
        <p className="text-[0.75rem] text-inkl mb-2">Heb je al eerder een rapport gedownload? Laad het hier om verder te werken waar je gebleven was.</p>
        <button
          type="button"
          onClick={() => { openFilePicker(); resetUploadState(); }}
          disabled={uploadState.loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-[0.77rem] font-medium rounded-md border border-rule text-inkl bg-transparent hover:bg-accents transition-all duration-150 cursor-pointer disabled:opacity-50"
        >
          <HiArrowUpTray className="text-[0.9rem]" />
          {uploadState.loading ? 'Bezig met lezen...' : 'Laad eerder rapport (.docx)'}
        </button>
        {uploadState.error && (
          <p className="text-[0.75rem] text-warn mt-2 flex items-center gap-1"><HiExclamationTriangle /> {uploadState.error}</p>
        )}
        {uploadState.success && (
          <p className="text-[0.75rem] text-ok mt-2">✓ Rapport geladen! Je kunt nu verder werken.</p>
        )}
      </Card>

      <Card icon={<HiUser />} title="Cliëntgegevens">
        <div className={SL}>Persoonsgegevens</div>
        <div className={row4}>
          <div><label className={L}>Cliëntnummer</label><input className="inp" value={state.clientnr} onChange={e => set({ clientnr: e.target.value })} placeholder="GZ-2026-..." /></div>
          <div><label className={L}>Voornamen</label><input className="inp" value={state.voornaam} onChange={e => set({ voornaam: e.target.value })} /></div>
          <div><label className={L}>Voorletters + achternaam</label><input className="inp" value={state.achternaam} onChange={e => set({ achternaam: e.target.value })} /></div>
          <div><label className={L}>Geboortedatum</label><input type="date" className="inp" value={state.geboortedatum} onChange={e => set({ geboortedatum: e.target.value })} /></div>
        </div>
        <div className={row3}>
          <div>
            <label className={L}>BSN</label>
            <input className="inp" value={state.bsn} maxLength={9} onChange={e => set({ bsn: e.target.value.replace(/\D/g, '') })} placeholder="000000000" />
            {state.bsn && !bsn11Proef(state.bsn) && (
              <p className="text-[0.7rem] text-warn mt-1 flex items-center gap-1"><HiExclamationTriangle /> Ongeldig BSN (9 cijfers, 11-proef faalt)</p>
            )}
          </div>
          <div>
            <label className={L}>Burgerlijke staat</label>
            <select className="inp" value={state.burgstaat} onChange={e => set({ burgstaat: e.target.value, huwelijksvoorwaarden: '' })}>
              <option value="">— Selecteer —</option>
              <option value="ongehuwd">Ongehuwd</option>
              <option value="gehuwd">Gehuwd</option>
              <option value="geregistreerd">Geregistreerd partnerschap</option>
              <option value="gescheiden">Gescheiden</option>
              <option value="weduwe">Weduwe/weduwnaar</option>
              <option value="samenwonend">Samenwonend (niet geregistreerd)</option>
            </select>
            {(state.burgstaat === 'gehuwd' || state.burgstaat === 'geregistreerd') && (
              <div className="mt-2">
                <label className={L}>Huwelijksvoorwaarden</label>
                <div className="flex gap-4 mt-1">
                  {state.burgstaat === 'gehuwd' ? (
                    <>
                      <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="checkbox" checked={state.huwelijksvoorwaarden === 'gvg'} onChange={e => set({ huwelijksvoorwaarden: e.target.checked ? 'gvg' : '' })} />
                        Gemeenschap van goederen (gvg)
                      </label>
                      <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="checkbox" checked={state.huwelijksvoorwaarden === 'huw.vw'} onChange={e => set({ huwelijksvoorwaarden: e.target.checked ? 'huw.vw' : '' })} />
                        Huwelijksvoorwaarden (huw.vw)
                      </label>
                    </>
                  ) : (
                    <label className="flex items-center gap-1 text-sm cursor-pointer">
                      <input type="checkbox" checked={state.huwelijksvoorwaarden === 'partnerschapsvoorwaarden'} onChange={e => set({ huwelijksvoorwaarden: e.target.checked ? 'partnerschapsvoorwaarden' : '' })} />
                      Partnerschapsvoorwaarden
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
          <div><label className={L}>Nationaliteit</label><input className="inp" value={state.nationaliteit} onChange={e => set({ nationaliteit: e.target.value })} placeholder="Bijv. Nederlands" /></div>
        </div>
        <div className={row2}>
          <div>
            <label className={L}>Geslacht</label>
            <RadioGroup value={state.geslacht} options={[{ value: 'man', label: 'Man' }, { value: 'vrouw', label: 'Vrouw' }, { value: 'non-binair', label: 'Non-binair' }]} onChange={v => set({ geslacht: v })} />
            <div className="text-[0.67rem] text-warn mt-0.5">Wordt niet overgenomen in de rapportage (bepaalt enkel het voornaamwoord hij/zij/hen).</div>
          </div>
          <div>
            <label className={L}>Gewenste aanspreektitel</label>
            <select className="inp" value={state.aanspreektitel} onChange={e => set({ aanspreektitel: e.target.value })}>
              <option value="">— Selecteer —</option>
              <option value="voornaam">Voornaam (je / jij)</option>
              <option value="meneer">Meneer (u)</option>
              <option value="mevrouw">Mevrouw (u)</option>
              <option value="hen">Hen (keuze: je / u / uw)</option>
            </select>
            <div className="text-[0.67rem] text-inkl mt-0.5">Bepaalt hoe de inwoner in het rapport wordt aangesproken. Komt zichtbaar in de rapportage (besproken in intake).</div>
            {state.aanspreektitel === 'hen' && (
              <div className="mt-[7px]">
                <label className={L}>Aanspreekvorm bij Hen</label>
                <select className="inp" value={state.aanspreek_vorm} onChange={e => set({ aanspreek_vorm: e.target.value })}>
                  <option value="">— Selecteer —</option>
                  <option value="je">je / jij</option>
                  <option value="u">u</option>
                  <option value="uw">uw</option>
                </select>
              </div>
            )}
          </div>
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
              <option value="jeugd_thuis">Jeugdige &lt;21 — woont (nog) thuis bij ouders</option>
              <option value="jeugd_zelfstandig">Jeugdige &lt;21 — zelfstandig wonend</option>
              <option value="alleenstaand">Alleenstaand (21+)</option>
              <option value="alleenstaande_ouder">Alleenstaande ouder (21+)</option>
              <option value="samenwonend">Samenwonend / Gehuwd</option>
              <option value="pensioen_alleen">Pensioengerechtigde — alleenstaand</option>
              <option value="pensioen_paar">Pensioengerechtigde — beiden AOW-gerechtigd</option>
              <option value="pensioen_gemengd">Pensioengerechtigde — partner jonger dan AOW-leeftijd</option>
              <option value="instelling">Verblijft in een instelling (zak-/kleedgeldnorm)</option>
            </select>
            {state.leefsituatie && NORM[state.leefsituatie] && (
              <div className="text-[0.67rem] text-accent mt-0.5 font-medium">
                Auto-ingevuld: €{NORM[state.leefsituatie].toLocaleString('nl-NL')} ({NORMPERIODE.label}, aanpasbaar)
              </div>
            )}
            {isJeugdOfInstelling(state.leefsituatie) && (
              <Alert variant="warn" icon={<HiExclamationTriangle />} title="Jeugd / instelling — norm niet automatisch">
                Voor deze situatie rekent de tool GEEN bijstandsnorm uit. Vul op tabblad Inkomen de juiste (verlaagde) norm in, met de bron (bijv. PW-tabel of overheid.nl). IIT is niet van toepassing (&lt;21 jaar / instelling). Kwijtschelding GBLT/gemeente is n.v.t. zolang er geen eigen belastingaanslag is.
              </Alert>
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
              <div>
                <label className={L}>BSN partner</label>
                <input className="inp" value={state.partner_bsn} maxLength={9} onChange={e => set({ partner_bsn: e.target.value.replace(/\D/g, '') })} placeholder="000000000" />
                {state.partner_bsn && !bsn11Proef(state.partner_bsn) && (
                  <p className="text-[0.7rem] text-warn mt-1 flex items-center gap-1"><HiExclamationTriangle /> Ongeldig BSN (9 cijfers, 11-proef faalt)</p>
                )}
              </div>
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

        {state.heeft_partner === 'nee' && (
          <div className="mb-[11px]">
            <label className={L}>Toelichting: waarom is de partner niet in de regeling?</label>
            <textarea className="inp" rows={2} value={state.partner_niet_reden} onChange={e => set({ partner_niet_reden: e.target.value })} placeholder="Bijv. partner wil niet meedoen, partner heeft eigen regeling, etc." />
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
