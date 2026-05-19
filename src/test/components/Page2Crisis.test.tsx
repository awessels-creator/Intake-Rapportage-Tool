import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page2Crisis from '../../components/pages/Page2Crisis'
import { renderWithState } from '../helpers'

describe('Page2Crisis', () => {
  // ── Issue #4: Reden aanmelding als apart Card ─────────────────────────────

  test('renders "Crisis & Urgentie" as its own card heading', () => {
    renderWithState(<Page2Crisis />)
    expect(screen.getByText('Crisis & Urgentie')).toBeInTheDocument()
  })

  test('renders "Reden aanmelding" as a separate card heading', () => {
    renderWithState(<Page2Crisis />)
    expect(screen.getByText('Reden aanmelding')).toBeInTheDocument()
  })

  test('hulpvraag textarea is visible under the Reden aanmelding heading', () => {
    renderWithState(<Page2Crisis />)
    expect(screen.getByText('Reden aanmelding')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/hulpvraag/i)).toBeInTheDocument()
  })

  // ── Issue #5: Bank kolom verwijderd ──────────────────────────────────────

  test('does not render a "Bank" column header in the bankrekeningen table', () => {
    renderWithState(<Page2Crisis />)
    // getAllByRole to handle multiple elements; look for exact "Bank" column header
    const headers = screen.queryAllByRole('columnheader')
    const bankHeader = headers.find(h => h.textContent === 'Bank')
    expect(bankHeader).toBeUndefined()
  })

  test('renders the bank toelichting textarea at the bottom of the bank card', () => {
    renderWithState(<Page2Crisis />)
    expect(screen.getByPlaceholderText(/toelichting.*rekening|bankrekening/i)).toBeInTheDocument()
  })

  test('bank toelichting shows in form state when typed', async () => {
    const user = userEvent.setup()
    renderWithState(<Page2Crisis />)
    const textarea = screen.getByPlaceholderText(/toelichting.*rekening|bankrekening/i)
    await user.type(textarea, 'Afspraken over rekening')
    expect(textarea).toHaveValue('Afspraken over rekening')
  })

  // ── Bankrekeningen tabel ──────────────────────────────────────────────────

  test('renders a "Rekening toevoegen" button', () => {
    renderWithState(<Page2Crisis />)
    expect(screen.getByText('Rekening toevoegen')).toBeInTheDocument()
  })

  test('adds a bank row when the button is clicked', async () => {
    const user = userEvent.setup()
    renderWithState(<Page2Crisis />)
    const initial = screen.getAllByPlaceholderText(/NL00 BANK/)
    await user.click(screen.getByText('Rekening toevoegen'))
    expect(screen.getAllByPlaceholderText(/NL00 BANK/)).toHaveLength(initial.length + 1)
  })

  // ── Crisis section ────────────────────────────────────────────────────────

  test('does not show crisis checkboxes when crisis is not ja', () => {
    renderWithState(<Page2Crisis />)
    expect(screen.queryByText('Dreigende afsluiting water')).not.toBeInTheDocument()
  })

  test('shows crisis checkboxes when crisis is ja', () => {
    renderWithState(<Page2Crisis />, { crisis: 'ja' })
    expect(screen.getByText('Dreigende afsluiting water')).toBeInTheDocument()
  })
})
