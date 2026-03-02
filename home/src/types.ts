export interface QuickAccessLink {
  url: string
  dname: string
  shortcuts: string[]
}

export interface KiwiPageData {
  title: string
  fTitle: string
  rawContent: string
  content: (Title | Paragraph | List | Table | Media)[]
}

export interface Title {
  type: "title"
  depth: number
  text: string
  id: string
}

export interface Paragraph {
  type: "paragraph"
  lines: Line[]
}

export interface Line {
  type: "line"
  chunks: (TextChunk | LinkChunk | FormatChunk)[]
}

export interface List {
  type: "list"
  indentType: "unordered" | "ordered" | "simple"
  elts: (Element | List)[]
}

export interface Element {
  type: "element"
  chunks: (TextChunk | LinkChunk | FormatChunk)[]
}

export interface Table {
  type: "table"
  width: number
  title?: string
  headers?: TableRow
  rows: TableRow[]
}

export interface TableRow {
  cells: TableCell[]
}

export interface TableCell {
  content: Line[]
}

export interface FormatChunk {
  type: "format"
  format: "bold" | "italic" | "underline"
  chunks: (TextChunk | LinkChunk | FormatChunk)[]
}

export interface TextChunk {
  type: "text"
  text: string
}

export interface LinkChunk {
  type: "link"
  text: string
  url: string
}

export interface Media {
  type: "media"
  mediaType: "image" | "video" | "audio"
  filename: string
  caption?: string
}
