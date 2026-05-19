import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page6Lasten from '../../components/pages/Page6Lasten'
import { renderWithState } from '../helpers'

const ink = (netto: string) => ({ bron: '', type: '', netto, uren: '', beslag: false })
const lasten = (id: string, bedrag: string, per = 'mnd') => ({ [id]: { bedrag, per, opm: '' } })

describe('Page6Lasten', () => {
  // ── Basic render ─────────────────────────────────────────────────────────

  test('renders the Vaste Lasten Overzicht heading', () => {
    renderWithState(<Page6Lasten />)
    expect(screen.getByText('Vaste Lasten Overzicht')).toBeInTheDocument()
  })

  test('shows "Totaal vaste lasten / maand" row', () => {
    renderWithState(<Page6Lasten />)
    expect(screen.getByText('Totaal vaste lasten / maand')).toBeInTheDocument()
  })

  // ── Total lasten calculation display ─────────────────────────────────────

  test('shows zero total when no amounts are filled in', () => {
    renderWithState(<Page6Lasten />)
    // The total row shows "€ 0,00" in Dutch locale
    expect(screen.getByText(/Totaal vaste lasten/)).toBeInTheDocument()
    // Container text contains 0,00
    const totalRow = screen.getByText('Totaal vaste lasten / maand').closest('div')
    expect(totalRow?.textContent).toContain('0')
  })

  test('reflects a huur expense in the total', () => {
    renderWithState(<Page6Lasten />, {
      lastenWaarden: lasten('huur', '800'),
    })
    // The monthly converted amount shows per row as "€800.00/mnd" or "€800,00/mnd"
    // and the total row should contain 800
    const totalRow = screen.getByText('Totaal vaste lasten / maand').closest('div')
    expect(totalRow?.textContent).toContain('800')
  })

  test('shows converted monthly amount for a quarterly expense', () => {
    renderWithState(<Page6Lasten />, {
      heeft_auto: 'ja',
      lastenWaarden: lasten('wegenb', '300', 'kwt'), // 300 / 3 = 100/mnd
    })
    // The per-row conversion column shows "€100.00/mnd"
    expect(screen.getByText(/€100\.00\/mnd/)).toBeInTheDocument()
  })

  // ── Besteedbaar (disposable income) ──────────────────────────────────────

  test('shows besteedbaar row when both income and lasten are filled in', () => {
    renderWithState(<Page6Lasten />, {
      inkomenData: [ink('1000')],
      lastenWaarden: lasten('huur', '800'),
    })
    expect(screen.getByText(/Besteedbaar \(inkomen/)).toBeInTheDocument()
  })

  test('besteedbaar shows correct positive value', () => {
    renderWithState(<Page6Lasten />, {
      inkomenData: [ink('1000')],
      lastenWaarden: lasten('huur', '700'),
    })
    const row = screen.getByText(/Besteedbaar \(inkomen/).closest('div')
    expect(row?.textContent).toContain('300')
  })

  test('besteedbaar shows correct negative value when lasten exceed income', () => {
    renderWithState(<Page6Lasten />, {
      inkomenData: [ink('500')],
      lastenWaarden: lasten('huur', '800'),
    })
    const row = screen.getByText(/Besteedbaar \(inkomen/).closest('div')
    // Negative value includes a minus sign
    expect(row?.textContent).toMatch(/-/)
    expect(row?.textContent).toContain('300')
  })

  test('does not show besteedbaar when income is zero', () => {
    renderWithState(<Page6Lasten />, {
      lastenWaarden: lasten('huur', '800'),
    })
    expect(screen.queryByText(/Besteedbaar \(inkomen/)).not.toBeInTheDocument()
  })

  // ── Auto-only rows ────────────────────────────────────────────────────────

  test('hides auto-only rows when heeft_auto is not ja', () => {
    renderWithState(<Page6Lasten />, { heeft_auto: 'nee' })
    expect(screen.queryByText('Autoverzekering')).not.toBeInTheDocument()
    expect(screen.queryByText('Wegenbelasting')).not.toBeInTheDocument()
  })

  test('shows auto-only rows when heeft_auto is ja', () => {
    renderWithState(<Page6Lasten />, { heeft_auto: 'ja' })
    expect(screen.getByText('Autoverzekering')).toBeInTheDocument()
    expect(screen.getByText('Wegenbelasting')).toBeInTheDocument()
  })

  // ── Kind-only rows ────────────────────────────────────────────────────────

  test('hides kinderopvang row when kinderen is not ja', () => {
    renderWithState(<Page6Lasten />, { kinderen: 'nee' })
    expect(screen.queryByText('Kinderopvang (eigen bijdrage)')).not.toBeInTheDocument()
  })

  test('shows kinderopvang row when kinderen is ja', () => {
    renderWithState(<Page6Lasten />, { kinderen: 'ja' })
    expect(screen.getByText('Kinderopvang (eigen bijdrage)')).toBeInTheDocument()
  })

  // ── Extra rows ────────────────────────────────────────────────────────────

  test('adds an extra expense row when the button is clicked', async () => {
    const user = userEvent.setup()
    renderWithState(<Page6Lasten />)
    await user.click(screen.getByText('Eigen post toevoegen'))
    // The new row shows "Eigen post" as its post name
    expect(screen.getByText('Eigen post')).toBeInTheDocument()
  })

  // ── Kwijtschelding alert ──────────────────────────────────────────────────

  test('shows kwijtschelding alert when income is below 120% of norm', () => {
    renderWithState(<Page6Lasten />, {
      bijstandsnorm: '1000',
      inkomenData: [ink('1100')],
    })
    expect(screen.getByText(/Kwijtschelding mogelijk/)).toBeInTheDocument()
  })

  // ── BVV section ───────────────────────────────────────────────────────────

  test('shows BVV section when both income and norm are set', () => {
    renderWithState(<Page6Lasten />, {
      bijstandsnorm: '1000',
      inkomenData: [ink('1000')],
    })
    expect(screen.getByText('Beslagvrije Voet (indicatief, jan 2026)')).toBeInTheDocument()
  })

  test('hides BVV section when income is missing', () => {
    renderWithState(<Page6Lasten />, { bijstandsnorm: '1000' })
    expect(screen.queryByText('Beslagvrije Voet (indicatief, jan 2026)')).not.toBeInTheDocument()
  })
})
