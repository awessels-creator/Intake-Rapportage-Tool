import '@testing-library/jest-dom/vitest'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// @testing-library/react can't auto-register its cleanup hook without Vitest
// globals enabled, so we register it manually here.
afterEach(() => { cleanup() })

// jsdom doesn't implement these browser APIs used by the app
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
window.confirm = vi.fn().mockReturnValue(true)
URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
