import type { FormState } from './types'

// Dunne wrapper: laadt de zware Word-export-implementatie (incl. docx) pas op
// het moment dat de gebruiker daadwerkelijk exporteert. Hierdoor blijft de
// ~600KB docx-bundle uit de initiële app-bundle (code-splitting).
export async function downloadWord(state: FormState): Promise<void> {
  const { buildAndSaveWord } = await import('./downloadImpl')
  await buildAndSaveWord(state)
}
