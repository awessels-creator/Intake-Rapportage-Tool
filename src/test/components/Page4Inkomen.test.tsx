import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page4Inkomen from '../../components/pages/Page4Inkomen'
import { renderWithState } from '../helpers'

// Reusable income item shape
const ink = (netto: string) => ({ bron: '', type: '', netto, uren: '', beslag: false, invoerPer: 'mnd' as const, inclVak: false, weekBedrag: '' })

describe('Page4Inkomen', () => {
  // ── Basic render ─────────────────────────────────────────────────────────

  test('renders the bijstandsnormen reference table', () => {
    renderWithState(<Page4Inkomen />)
    expect(screen.getByText(/Bijstandsnormen 1 januari 2026/)).toBeInTheDocument()
  })

  test('renders the income source table header', () => {
    renderWithState(<Page4Inkomen />)
    expect(screen.getByText('Netto/mnd')).toBeInTheDocument()
  })

  // ── Income percentage badge ───────────────────────────────────────────────

  test('shows income percentage badge when both norm and income are set', () => {
    renderWithState(<Page4Inkomen />, {
      bijstandsnorm: '1000',
      inkomenData: [ink('1000')],
    })
    expect(screen.getByText(/100\.0% van bijstandsnorm/)).toBeInTheDocument()
  })

  test('does not show badge when norm is missing', () => {
    renderWithState(<Page4Inkomen />, {
      bijstandsnorm: '',
      inkomenData: [ink('1000')],
    })
    expect(screen.queryByText(/van bijstandsnorm/)).not.toBeInTheDocument()
  })

  // ── Income alerts ─────────────────────────────────────────────────────────

  test('shows bijstand alert when income is below 100% of norm', () => {
    renderWithState(<Page4Inkomen />, {
      bijstandsnorm: '1000',
      inkomenData: [ink('900')],
    })
    expect(screen.getByText('Inkomen onder bijstandsniveau')).toBeInTheDocument()
  })

  test('does not show bijstand alert when income is at 100% of norm', () => {
    renderWithState(<Page4Inkomen />, {
      bijstandsnorm: '1000',
      inkomenData: [ink('1000')],
    })
    expect(screen.queryByText('Inkomen onder bijstandsniveau')).not.toBeInTheDocument()
  })

  test('shows IIT alert when income is between 100% and 105% of norm', () => {
    renderWithState(<Page4Inkomen />, {
      bijstandsnorm: '1000',
      inkomenData: [ink('1020')],
      leefsituatie: 'alleenstaand', // not pensioen
    })
    expect(screen.getByText('IIT — tijdsduur controleren')).toBeInTheDocument()
  })

  test('does not show IIT alert for pensioen leefsituatie', () => {
    renderWithState(<Page4Inkomen />, {
      bijstandsnorm: '1000',
      inkomenData: [ink('1020')],
      leefsituatie: 'pensioen_alleen',
    })
    expect(screen.queryByText('IIT — tijdsduur controleren')).not.toBeInTheDocument()
  })

  test('shows FDMA alert when income is below 110% of norm', () => {
    renderWithState(<Page4Inkomen />, {
      bijstandsnorm: '1000',
      inkomenData: [ink('1050')],
      leefsituatie: 'alleenstaand',
    })
    // Use getAllByText because the alert title and the description both reference FDMA
    expect(screen.getAllByText(/FDMA/).length).toBeGreaterThan(0)
  })

  test('shows kwijtschelding alert when income is below 120% of norm', () => {
    renderWithState(<Page4Inkomen />, {
      bijstandsnorm: '1000',
      inkomenData: [ink('1100')],
    })
    expect(screen.getByText(/Kwijtschelding mogelijk/)).toBeInTheDocument()
  })

  test('shows no alerts when no income or norm are filled in', () => {
    renderWithState(<Page4Inkomen />)
    expect(screen.queryByText('Inkomen onder bijstandsniveau')).not.toBeInTheDocument()
    expect(screen.queryByText(/FDMA/)).not.toBeInTheDocument()
  })

  // ── Bijstandsnormen excl. vakantietoeslag (issue #13) ────────────────────

  test('reference table header says excl. vakantietoeslag', () => {
    renderWithState(<Page4Inkomen />)
    expect(screen.getByText(/excl\. vakantietoeslag/)).toBeInTheDocument()
    expect(screen.queryByText(/incl\. 5% vakantietoeslag/)).not.toBeInTheDocument()
  })

  test('reference table shows alleenstaand norm excl. vakantietoeslag (€ 1.331,42)', () => {
    renderWithState(<Page4Inkomen />)
    expect(screen.getByText(/1\.331,42/)).toBeInTheDocument()
  })

  test('reference table shows samenwonend norm excl. vakantietoeslag (€ 1.902,09)', () => {
    renderWithState(<Page4Inkomen />)
    expect(screen.getByText(/1\.902,09/)).toBeInTheDocument()
  })

  test('auto-ingevuld hint says excl. vakantietoeslag', () => {
    renderWithState(<Page4Inkomen />, { leefsituatie: 'alleenstaand' })
    expect(screen.getAllByText(/excl\. vakantietoeslag/).length).toBeGreaterThan(0)
  })

  // ── Alimentatie section ───────────────────────────────────────────────────

  test('hides alimony amount fields by default', () => {
    renderWithState(<Page4Inkomen />)
    expect(screen.queryByText('Partneralimentatie (netto/mnd)')).not.toBeInTheDocument()
  })

  test('shows alimony amount fields when alim_ontvangen is ja', () => {
    renderWithState(<Page4Inkomen />, { alim_ontvangen: 'ja' })
    expect(screen.getByText('Partneralimentatie (netto/mnd)')).toBeInTheDocument()
    expect(screen.getByText('Kinderalimentatie (netto/mnd)')).toBeInTheDocument()
  })

  // ── Beslag section ────────────────────────────────────────────────────────

  test('hides beslag table when no income source has beslag', () => {
    renderWithState(<Page4Inkomen />, {
      inkomenData: [{ ...ink('1000'), beslag: false }],
    })
    expect(screen.queryByText('Beslagleggende schuldeiser')).not.toBeInTheDocument()
  })

  test('shows beslag table when an income source has beslag=true', () => {
    renderWithState(<Page4Inkomen />, {
      inkomenData: [{ ...ink('1000'), beslag: true }],
    })
    expect(screen.getByText('Beslagleggende schuldeiser')).toBeInTheDocument()
  })

  // ── Issue #7: Weekinkomen + vakantiegeld ──────────────────────────────────

  test('renders a period selector for each income row', () => {
    renderWithState(<Page4Inkomen />)
    // Default should be per month
    expect(screen.getAllByRole('option', { name: /Per maand/i }).length).toBeGreaterThan(0)
  })

  test('shows week input field when "Per week" is selected', async () => {
    const user = userEvent.setup()
    renderWithState(<Page4Inkomen />)
    const selects = screen.getAllByRole('combobox')
    const periodSelect = selects.find(s =>
      Array.from(s.querySelectorAll('option')).some(o => o.textContent?.includes('Per week'))
    )
    expect(periodSelect).toBeDefined()
    await user.selectOptions(periodSelect!, 'week')
    expect(screen.getByPlaceholderText(/weekbedrag/i)).toBeInTheDocument()
  })

  // ── Interactivity ─────────────────────────────────────────────────────────

  test('adds a new income row when "Inkomstenbron toevoegen" is clicked', async () => {
    const user = userEvent.setup()
    renderWithState(<Page4Inkomen />)
    // Initially 1 row (from mkInitial)
    expect(screen.getAllByPlaceholderText('Naam werkgever / instantie')).toHaveLength(1)
    await user.click(screen.getByText('Inkomstenbron toevoegen'))
    expect(screen.getAllByPlaceholderText('Naam werkgever / instantie')).toHaveLength(2)
  })
})
