import { useCallback, useRef, useState } from 'react'
import { useForm } from '../context'
import { readSessionDataFromDocxBlob } from '../docxSession'
import { mkInitial } from '../utils'

interface UploadState {
  loading: boolean
  error: string | null
  success: boolean
}

export function useDocxUpload() {
  const { set } = useForm()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    loading: false,
    error: null,
    success: false,
  })

  const openFilePicker = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.docx'
      input.style.display = 'none'
      input.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) await handleFile(file)
        input.remove()
      })
      document.body.appendChild(input)
      fileInputRef.current = input
    }
    fileInputRef.current.click()
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setUploadState({ loading: true, error: null, success: false })

    if (!file.name.endsWith('.docx')) {
      setUploadState({ loading: false, error: 'Dit is geen .docx-bestand. Alleen Word-documenten (.docx) worden ondersteund.', success: false })
      return
    }

    try {
      // File omzetten naar ArrayBuffer voor JSZip
      const arrayBuffer = await file.arrayBuffer()
      const sessionData = await readSessionDataFromDocxBlob(arrayBuffer)

      if (!sessionData) {
        setUploadState({ loading: false, error: 'Dit .docx bevat geen sessie-data van deze tool. Is dit een rapport dat je eerder hebt gedownload?', success: false })
        return
      }

      // Herstel de state: merge met mkInitial zodat nieuwe velden niet ontbreken
      const restoredState = { ...mkInitial(), ...sessionData }
      set(restoredState)
      setUploadState({ loading: false, error: null, success: true })
    } catch (err) {
      setUploadState({ loading: false, error: 'Fout bij lezen: ' + (err instanceof Error ? err.message : 'onbekende fout'), success: false })
    }
  }, [set])

  const resetUploadState = useCallback(() => {
    setUploadState({ loading: false, error: null, success: false })
  }, [])

  return { openFilePicker, uploadState, resetUploadState }
}
