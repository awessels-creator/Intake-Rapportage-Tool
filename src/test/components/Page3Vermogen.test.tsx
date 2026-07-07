import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import Page3Vermogen from '../../components/pages/Page3Vermogen'
import { renderWithState } from '../helpers'

describe('Page3Vermogen', () => {
  // ── Issue #6: Label toelichting ───────────────────────────────────────────

  test('shows "Toelichting op vermogen en verzekeringen" label', () => {
    renderWithState(<Page3Vermogen />)
    expect(screen.getByText('Toelichting op vermogen en verzekeringen')).toBeInTheDocument()
    expect(screen.queryByText('Toelichting vermogen')).not.toBeInTheDocument()
  })

  // ── Issue #6: Wanbetalersregeling ─────────────────────────────────────────

  test('renders "Wanbetalersregeling (CAK)" toggle', () => {
    renderWithState(<Page3Vermogen />)
    expect(screen.getByText('Wanbetalersregeling (CAK)')).toBeInTheDocument()
  })

  test('renders "Aanvullende zorgverzekering" toggle instead of old label', () => {
    renderWithState(<Page3Vermogen />)
    expect(screen.getByText('Aanvullende zorgverzekering')).toBeInTheDocument()
    expect(screen.queryByText('Zorgverzekering (aanvullend)')).not.toBeInTheDocument()
  })

  test('shows wanbetalers warning alert when tw_wanbet is ja', () => {
    renderWithState(<Page3Vermogen />, { tw_wanbet: 'ja' })
    expect(screen.getByText(/Wanbetalersregeling actief/)).toBeInTheDocument()
  })

  test('does not show wanbetalers alert when tw_wanbet is nee', () => {
    renderWithState(<Page3Vermogen />, { tw_wanbet: 'nee' })
    expect(screen.queryByText(/Wanbetalersregeling actief/)).not.toBeInTheDocument()
  })

  // ── Basic render ──────────────────────────────────────────────────────────

  test('renders the Vermogen card heading', () => {
    renderWithState(<Page3Vermogen />)
    expect(screen.getByText('Vermogen & Bezittingen')).toBeInTheDocument()
  })

  test('shows voertuig 1 section by default', () => {
    renderWithState(<Page3Vermogen />, { voertuigen: [{ kenteken: '', merk: '', bouwjaar: '', waarde: '', reden: '', behoud: '' }] })
    expect(screen.getByText('Voertuig 1')).toBeInTheDocument()
  })

  test('shows add-voertuig button', () => {
    renderWithState(<Page3Vermogen />)
    expect(screen.getByText('Voertuig toevoegen')).toBeInTheDocument()
  })

  test('shows overig vermogen section', () => {
    renderWithState(<Page3Vermogen />)
    expect(screen.getByText(/Overig vermogen \(boot, caravan/)).toBeInTheDocument()
  })
})
