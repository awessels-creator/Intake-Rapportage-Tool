import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page5Toeslagen from '../../components/pages/Page5Toeslagen'
import { renderWithState } from '../helpers'

describe('Page5Toeslagen', () => {
  // ── Issue #8: Verwijder bijzondere bijstand + AIO ─────────────────────────

  test('does not render "Bijzondere bijstand"', () => {
    renderWithState(<Page5Toeslagen />)
    expect(screen.queryByText('Bijzondere bijstand')).not.toBeInTheDocument()
  })

  test('does not render "AIO"', () => {
    renderWithState(<Page5Toeslagen />)
    expect(screen.queryByText(/AIO/)).not.toBeInTheDocument()
  })

  test('renders "Overige inkomsten" toeslag block', () => {
    renderWithState(<Page5Toeslagen />)
    expect(screen.getByText('Overige inkomsten')).toBeInTheDocument()
  })

  test('shows a name input when Overige inkomsten is activated', async () => {
    const user = userEvent.setup()
    renderWithState(<Page5Toeslagen />)
    const checkbox = screen.getByText('Overige inkomsten').closest('label')?.querySelector('input[type="checkbox"]')!
    await user.click(checkbox)
    expect(screen.getByPlaceholderText(/Omschrijving/i)).toBeInTheDocument()
  })

  // ── Standard toeslagen still present ─────────────────────────────────────

  test('renders Huurtoeslag', () => {
    renderWithState(<Page5Toeslagen />)
    expect(screen.getByText('Huurtoeslag')).toBeInTheDocument()
  })

  test('renders Zorgtoeslag', () => {
    renderWithState(<Page5Toeslagen />)
    expect(screen.getByText('Zorgtoeslag')).toBeInTheDocument()
  })

  test('renders Kinderbijslag (AKW)', () => {
    renderWithState(<Page5Toeslagen />)
    expect(screen.getByText('Kinderbijslag (AKW)')).toBeInTheDocument()
  })

  // ── Activation shows bedrag field ─────────────────────────────────────────

  test('shows bedrag input when huurtoeslag is activated', async () => {
    const user = userEvent.setup()
    renderWithState(<Page5Toeslagen />)
    const checkbox = screen.getByText('Huurtoeslag').closest('label')?.querySelector('input[type="checkbox"]')!
    await user.click(checkbox)
    expect(screen.getByPlaceholderText(/Bedrag\/mnd/)).toBeInTheDocument()
  })
})
