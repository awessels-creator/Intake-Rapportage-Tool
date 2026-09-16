import JSZip from 'jszip'
import type { FormState } from './types'

/**
 * Voeg sessie-data (FormState) toe als verborgen custom property aan een .docx-blob.
 * De data wordt opgeslagen in docProps/custom.xml als JSON-string.
 * Dit is een standaard Office-mechanisme (Custom XML Properties).
 */
export async function addSessionDataToDocxBlob(
  docxArrayBuffer: ArrayBuffer,
  state: FormState
): Promise<Blob> {
  const zip = new JSZip()
  await zip.loadAsync(docxArrayBuffer)

  // Sessie-data als JSON
  const sessionJson = JSON.stringify(state)

  // Custom properties XML
  const customPropsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" ' +
    'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
    '<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="session_data">' +
    '<vt:lpwstr>' +
    sessionJson
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;') +
    '</vt:lpwstr>' +
    '</property>' +
    '</Properties>'

  // Voeg custom.xml toe
  zip.file('docProps/custom.xml', customPropsXml)

  // Update [Content_Types].xml om custom.xml op te nemen
  const contentTypesFile = zip.file('[Content_Types].xml')
  if (contentTypesFile) {
    let contentTypesXml = await contentTypesFile.async('string')
    if (contentTypesXml.indexOf('docProps/custom.xml') === -1) {
      contentTypesXml = contentTypesXml.replace(
        '</Types>',
        '<Override PartName="/docProps/custom.xml" ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/></Types>'
      )
      zip.file('[Content_Types].xml', contentTypesXml)
    }
  }

  // Update _rels/.rels om relatie toe te voegen
  const relsFile = zip.file('_rels/.rels')
  if (relsFile) {
    let relsXml = await relsFile.async('string')
    if (relsXml.indexOf('docProps/custom.xml') === -1) {
      relsXml = relsXml.replace(
        '</Relationships>',
        '<Relationship Id="rIdCustom" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="docProps/custom.xml"/></Relationships>'
      )
      zip.file('_rels/.rels', relsXml)
    }
  }

  // Genereer nieuwe blob
  return await zip.generateAsync({ type: 'blob' })
}

/**
 * Lees sessie-data uit een .docx-blob.
 * Return null als het bestand geen sessie-data bevat.
 */
export async function readSessionDataFromDocxBlob(
  docxArrayBuffer: ArrayBuffer
): Promise<FormState | null> {
  const zip = new JSZip()
  await zip.loadAsync(docxArrayBuffer)

  // Zoek custom.xml
  const customFile = zip.file('docProps/custom.xml')
  if (!customFile) return null

  const customXml = await customFile.async('string')

  // Parse de session_data property
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(customXml, 'text/xml')
  const properties = xmlDoc.getElementsByTagName('property')

  for (let i = 0; i < properties.length; i++) {
    const name = properties[i].getAttribute('name')
    if (name === 'session_data') {
      const lpwstr = properties[i].getElementsByTagName('vt:lpwstr')[0]
      if (lpwstr && lpwstr.textContent) {
        try {
          return JSON.parse(lpwstr.textContent) as FormState
        } catch {
          return null
        }
      }
    }
  }

  return null
}

/**
 * Controleer of een .docx-blob sessie-data bevat (zonder te parsen).
 */
export async function hasSessionData(docxArrayBuffer: ArrayBuffer): Promise<boolean> {
  const zip = new JSZip()
  await zip.loadAsync(docxArrayBuffer)
  return !!zip.file('docProps/custom.xml')
}
