declare module 'html-to-docx' {
  interface HtmlToDocxOptions {
    table?: { row?: { cantSplit?: boolean } }
    footer?: boolean
    pageNumber?: boolean
  }
  function htmlToDocx(html: string, options?: HtmlToDocxOptions | null): Promise<Blob>
  export default htmlToDocx
}
