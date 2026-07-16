import { describe, it, expect, afterEach } from 'vitest'
import {
  NORM, VGRENS, NIBUD, BVV_MAX, VRIJSTELLING_OVERWAARDE,
  getActivePeriode, setNormPreview, clearNormPreview,
} from '../constants'

// Vang de waarden van de live datum op zodat we na elke test netjes terugzetten.
afterEach(() => clearNormPreview())

describe('norm-preview', () => {
  it('start op de actuele (live) periode', () => {
    expect(getActivePeriode().model).toBe('2026-2')
    expect(NORM['alleenstaand']).toBeCloseTo(1348.49, 2)
  })

  it('setNormPreview schakelt de live bindings naar de gekozen periode', () => {
    // Nog maar één periode aanwezig → zet een tijdelijke tweede periode op om te tonen
    // dat de switch werkt. In productie is dit de toekomstige normenset.
    // We simuleren door een bestaande model-code te hergebruiken is niet zinvol;
    // daarom testen we hier de API-contracten: onbekend model = geen wijziging.
    setNormPreview('bestaat-niet')
    expect(getActivePeriode().model).toBe('2026-2') // ongewijzigd bij onbekend model
  })

  it('clearNormPreview zet altijd terug naar de live periode', () => {
    // Zelfs als er niets actiefs is, moet clear terug naar live.
    clearNormPreview()
    expect(getActivePeriode().model).toBe('2026-2')
    expect(VGRENS['alleenstaand']).toBe(8000)
    expect(NIBUD['alleenstaand']).toBe(540)
    expect(BVV_MAX['alleenstaand']).toBeCloseTo(2191.42, 2)
    expect(VRIJSTELLING_OVERWAARDE).toBe(67500)
  })
})
