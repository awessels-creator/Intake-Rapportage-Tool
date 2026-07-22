import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page1Persoonlijk from '../../components/pages/Page1Persoonlijk'
import { renderWithState } from '../helpers'

describe('Page1Persoonlijk', () => {
  // Reden aanmelding / hulpvraag staat bovenaan de Persoonlijk-pagina (verplaatst van Crisis)

  test('renders "Persoonlijke omstandigheden & Achtergrond" card heading', () => {
    renderWithState(<Page1Persoonlijk />)
    expect(screen.getByText('Persoonlijke omstandigheden & Achtergrond')).toBeInTheDocument()
  })

  test('renders "Reden aanmelding / hulpvraag" field bovenaan de pagina', () => {
    renderWithState(<Page1Persoonlijk />)
    expect(screen.getByText('Reden aanmelding / hulpvraag')).toBeInTheDocument()
  })

  test('hulpvraag textarea is visible', () => {
    renderWithState(<Page1Persoonlijk />)
    expect(screen.getByPlaceholderText(/hulpvraag/i)).toBeInTheDocument()
  })

  test('hulpvraag is vóór de woonsituatie-sectie', () => {
    renderWithState(<Page1Persoonlijk />)
    const hulpvraag = screen.getByText('Reden aanmelding / hulpvraag')
    const woonsit = screen.getByText('Woonsituatie / sociaal netwerk')
    expect(hulpvraag.compareDocumentPosition(woonsit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('hulpvraag textarea writes to form state', async () => {
    const user = userEvent.setup()
    renderWithState(<Page1Persoonlijk />)
    const textarea = screen.getByPlaceholderText(/hulpvraag/i)
    await user.type(textarea, 'Komt niet rond met inkomen')
    expect(textarea).toHaveValue('Komt niet rond met inkomen')
  })
})
