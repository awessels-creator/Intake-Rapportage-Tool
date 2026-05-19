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

  test('shows auto-veld when heeft_auto is ja', () => {
    renderWithState(<Page3Vermogen />, { heeft_auto: 'ja' })
    expect(screen.getByText('Voertuiggegevens')).toBeInTheDocument()
  })

  test('hides auto-veld when heeft_auto is nee', () => {
    renderWithState(<Page3Vermogen />, { heeft_auto: 'nee' })
    expect(screen.queryByText('Voertuiggegevens')).not.toBeInTheDocument()
  })
})
