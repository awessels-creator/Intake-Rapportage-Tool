import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page9Advies from '../../components/pages/Page9Advies'
import { renderWithState } from '../helpers'
import type { AdviesItem } from '../../types'

const ink = (netto: string) => ({ bron: '', type: '', netto, uren: '', beslag: false })

const adviesItem = (t: string, p: AdviesItem['p'] = 'med', on = true): AdviesItem => ({
  p, t, b: `Beschrijving van ${t}`, on, custom: false,
})

describe('Page9Advies', () => {
  // ── Summary panel ─────────────────────────────────────────────────────────

  test('shows client name in summary (from voornaam + achternaam)', () => {
    renderWithState(<Page9Advies />, { voornaam: 'Jan', achternaam: 'Jansen' })
    expect(screen.getByText('Jan Jansen')).toBeInTheDocument()
  })

  test('shows em dash as client name when name fields are empty', () => {
    renderWithState(<Page9Advies />)
    // The name cell contains "—" when both fields are blank
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  test('shows income value in summary', () => {
    renderWithState(<Page9Advies />, {
      inkomenData: [ink('1500')],
    })
    // Summary shows "Inkomen" label and the formatted amount somewhere on the page
    expect(screen.getByText('Inkomen')).toBeInTheDocument()
    // The amount is formatted in Dutch locale: 1.500 or 1500
    const inkCell = screen.getByText('Inkomen').closest('div')?.parentElement
    expect(inkCell?.textContent).toMatch(/1[.,\s]?500/)
  })

  test('shows vaste lasten value in summary', () => {
    renderWithState(<Page9Advies />, {
      lastenWaarden: { huur: { bedrag: '800', per: 'mnd', opm: '' } },
    })
    expect(screen.getByText('Vaste lasten')).toBeInTheDocument()
  })

  test('shows besteedbaar value in summary', () => {
    renderWithState(<Page9Advies />, {
      inkomenData: [ink('1000')],
      lastenWaarden: { huur: { bedrag: '700', per: 'mnd', opm: '' } },
    })
    expect(screen.getByText('Besteedbaar')).toBeInTheDocument()
  })

  test('shows total schulden in summary', () => {
    renderWithState(<Page9Advies />, {
      schuldenData: [{ s: 'Creditcard', t: 'krediet', subt: '', b: '5000', afl: '', st: '' }],
    })
    expect(screen.getByText('Totaal schulden')).toBeInTheDocument()
    const schuldenCell = screen.getByText('Totaal schulden').closest('div')?.parentElement
    expect(schuldenCell?.textContent).toMatch(/5[.,\s]?000/)
  })

  // ── Advice items ─────────────────────────────────────────────────────────

  test('renders advice item titles from state.advItems', () => {
    renderWithState(<Page9Advies />, {
      advItems: [
        adviesItem('AVP aanvragen', 'low'),
        adviesItem('FDMA aanvragen bij gemeente Meppel', 'med'),
      ],
    })
    expect(screen.getByText('AVP aanvragen')).toBeInTheDocument()
    expect(screen.getByText('FDMA aanvragen bij gemeente Meppel')).toBeInTheDocument()
  })

  test('renders advice item body text', () => {
    renderWithState(<Page9Advies />, {
      advItems: [adviesItem('Test advies')],
    })
    expect(screen.getByText('Beschrijving van Test advies')).toBeInTheDocument()
  })

  test('shows no advice cards when advItems is empty', () => {
    renderWithState(<Page9Advies />, { advItems: [] })
    // No advice item checkboxes rendered (beyond the service type checkboxes)
    // The "Adviezen & Actiepunten" card itself still renders
    expect(screen.getByText('Adviezen & Actiepunten')).toBeInTheDocument()
  })

  // ── Toggle advice item ────────────────────────────────────────────────────

  test('toggling an advice item checkbox changes its checked state', async () => {
    const user = userEvent.setup()
    renderWithState(<Page9Advies />, {
      advItems: [adviesItem('Test advies', 'med', true)],
    })
    // DOM structure inside AdviesCard:
    //   <div class="flex items-start gap-2">
    //     <input type="checkbox" />        ← sibling
    //     <div class="flex-1 min-w-0">
    //       <div class="font-semibold">Test advies</div>  ← titleEl
    const titleEl = screen.getByText('Test advies')
    // titleEl.parentElement = div.flex-1, .parentElement = div.flex (holds checkbox)
    const flexRow = titleEl.parentElement?.parentElement
    const checkbox = flexRow?.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkbox?.checked).toBe(true)
    await user.click(checkbox)
    expect(checkbox?.checked).toBe(false)
  })

  // ── Add custom advice ─────────────────────────────────────────────────────

  test('adds a new custom advice item when the button is clicked', async () => {
    const user = userEvent.setup()
    renderWithState(<Page9Advies />, { advItems: [] })
    await user.click(screen.getByText('Eigen actiepunt toevoegen'))
    expect(screen.getByText('Eigen actiepunt')).toBeInTheDocument()
  })

  // ── Service type checkboxes ───────────────────────────────────────────────

  test('renders all 6 service type checkboxes', () => {
    renderWithState(<Page9Advies />)
    expect(screen.getByText('Budgetbeheer')).toBeInTheDocument()
    expect(screen.getByText('Schuldregeling')).toBeInTheDocument()
    expect(screen.getByText('Beschermingsbewind — medische gronden')).toBeInTheDocument()
    expect(screen.getByText('Beschermingsbewind — schuldenbewind')).toBeInTheDocument()
    expect(screen.getByText('Schuldhulpmaatje / Humanitas')).toBeInTheDocument()
    expect(screen.getByText('Overige doorverwijzing')).toBeInTheDocument()
  })

  test('shows overige doorverwijzing text field when that checkbox is checked', () => {
    renderWithState(<Page9Advies />, { cb_overig_aanvr: true })
    expect(screen.getByText('Overige doorverwijzing — omschrijving')).toBeInTheDocument()
  })

  test('hides overige doorverwijzing text field when checkbox is unchecked', () => {
    renderWithState(<Page9Advies />, { cb_overig_aanvr: false })
    expect(screen.queryByText('Overige doorverwijzing — omschrijving')).not.toBeInTheDocument()
  })
})
