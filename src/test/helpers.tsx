import { act, render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { FormProvider, useForm } from '../context'
import type { FormState } from '../types'

/**
 * Renders a component inside FormProvider and synchronously applies an
 * optional initial state patch before returning.
 *
 * Usage:
 *   renderWithState(<Page4Inkomen />, { bijstandsnorm: '1000', inkomenData: [...] })
 */
export function renderWithState(ui: ReactElement, initialState: Partial<FormState> = {}) {
  // Capture the `set` function from inside the provider tree
  const setRef = { current: null as ((patch: Partial<FormState>) => void) | null }

  function SetCapture() {
    setRef.current = useForm().set
    return null
  }

  const result = render(
    <FormProvider>
      <SetCapture />
      {ui}
    </FormProvider>,
  )

  // Apply the initial state patch in a synchronous act() so React flushes
  // all re-renders before the test body reads the DOM.
  if (Object.keys(initialState).length > 0 && setRef.current) {
    act(() => { setRef.current!(initialState) })
  }

  return result
}
