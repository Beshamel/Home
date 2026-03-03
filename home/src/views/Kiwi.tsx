import { useEffect, useState, Fragment, useRef } from "react"
import type {
  FormatChunk,
  KiwiPageData,
  Line,
  LinkChunk,
  List,
  Media,
  Paragraph,
  Table,
  TextChunk,
  Title,
} from "../types"
import { useNavigate, useParams } from "react-router"
import queryClient, { API_BASE_URL } from "../api/client"
import { isAxiosError } from "axios"
import "katex/dist/katex.min.css"
import Latex from "react-latex-next"

function Kiwi() {
  const { title: f_title } = useParams<{ title: string }>()
  const [pageContent, setPageContent] = useState<KiwiPageData | null>(null)
  const [newPage, setNewPage] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState(f_title?.replace("_", " ") || "")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<KiwiPageData[]>([])
  const searchRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  if (!f_title) {
    return <div className="kiwi-page">{"Euh ça devrait pas arriver ça..."}</div>
  }

  useEffect(() => {
    if (!f_title) return
    async function fetchPageContent() {
      try {
        const response = await queryClient.get<KiwiPageData>(`/kiwi`, {
          params: { f_title: f_title },
        })
        const data = response.data
        setPageContent(data)
      } catch (error) {
        if (isAxiosError(error) && error.response && error.response.status === 404) {
          setPageContent({
            title: f_title || "",
            fTitle: f_title || "",
            rawContent: "",
            content: [],
          })
          setNewPage(true)
        } else {
          console.error("Error fetching page content:", error)
        }
      }
    }
    fetchPageContent()
  }, [f_title])

  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      const searchFocused = searchRef.current?.contains(document.activeElement)
      const key = e.key?.toLowerCase()
      if (key === "e" && !newPage && !searchFocused) {
        e.preventDefault()
        handleEditPage()
      }
      if (key === "h" && !newPage && !searchFocused) {
        e.preventDefault()
        handleGoHome()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [f_title])

  const handleCreatePage = async (e: React.SubmitEvent) => {
    e.preventDefault()
    try {
      await queryClient.post("/kiwi", null, {
        params: {
          title: newPageTitle,
          raw_content: `# ${newPageTitle}\n\n`,
        },
      })
      handleEditPage()
    } catch (error) {
      console.error("Error creating page:", error)
      alert("Failed to create page.")
    }
  }

  const handleGoHome = () => {
    navigate(`/kiwi`)
  }

  const handleEditPage = () => {
    navigate(`/kiwi/${f_title}/edit`)
  }

  return (
    <>
      <div className="kiwi-page">
        <div className="kiwi-sidebar">
          {pageContent && <div className="kiwi-toc">{renderTableOfContents(pageContent)}</div>}
        </div>
        <main className="kiwi-main">
          <button onClick={handleGoHome}>{"Home"}</button>
          {!newPage && <button onClick={handleEditPage}>{"Edit"}</button>}
          <input
            className="search-input"
            type="text"
            placeholder="Search..."
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (searchQuery.trim() === "") {
                  setSearchResults([])
                  return
                }
                try {
                  const response = await queryClient.get<KiwiPageData[]>(`/kiwi/search`, {
                    params: { query: searchQuery },
                  })
                  setSearchResults(response.data)
                } catch (error) {
                  console.error("Error searching pages:", error)
                  alert("Failed to search pages.")
                }
              }
            }}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              <p>{"Search results :"}</p>
              <ul>
                {searchResults.map((result) => (
                  <li key={result.fTitle}>
                    <a href={`/kiwi/${result.fTitle}`}>{result.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {newPage ? (
            <>
              <p>{"This page does not exist yet. You can create it here."}</p>
              <form className="kiwi-create-form" onSubmit={handleCreatePage}>
                {"Title : "}
                <input
                  className="title-input"
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value)
                  }}
                />
                <button type="submit">{"Create"}</button>
              </form>
            </>
          ) : pageContent ? (
            renderContent(pageContent)
          ) : (
            <p>Loading...</p>
          )}
        </main>
      </div>
    </>
  )
}

function renderContent(data: KiwiPageData) {
  return (
    <>
      {data.content.map((content, k) => (
        <Fragment key={k}>
          {content.type === "title"
            ? renderTitle(content)
            : content.type === "paragraph"
              ? renderParagraph(content)
              : content.type === "list"
                ? renderList(content)
                : content.type === "table"
                  ? renderTable(content)
                  : content.type === "media"
                    ? renderMedia(content)
                    : null}
        </Fragment>
      ))}
    </>
  )
}

function renderTableOfContents(data: KiwiPageData) {
  const titles = data.content.filter((content): content is Title => content.type === "title")
  if (titles.length === 0) return null
  return (
    <div className="table-of-contents">
      {titles.map((title) => (
        <div
          key={title.id}
          className={`toc-item depth-${title.depth}`}
          onClick={() =>
            title.depth === 1
              ? window.scrollTo({ top: 0, behavior: "smooth" })
              : document.getElementById(`title-${title.id}`)?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <div
            className={`toc-item-text depth-${title.depth}`}
            style={{ paddingLeft: `${Math.max(0.75 * (title.depth - 2), 0)}rem` }}
          >
            {title.text}
          </div>
        </div>
      ))}
    </div>
  )
}

function renderTitle(title: Title) {
  return title.depth === 1 ? (
    <h1 id={`title-${title.id}`}>{title.text}</h1>
  ) : title.depth === 2 ? (
    <h2 id={`title-${title.id}`}>{title.text}</h2>
  ) : title.depth === 3 ? (
    <h3 id={`title-${title.id}`}>{title.text}</h3>
  ) : title.depth === 4 ? (
    <h4 id={`title-${title.id}`}>{title.text}</h4>
  ) : title.depth === 5 ? (
    <h5 id={`title-${title.id}`}>{title.text}</h5>
  ) : title.depth === 6 ? (
    <h6 id={`title-${title.id}`}>{title.text}</h6>
  ) : (
    <span id={`title-${title.id}`}>{title.text}</span>
  )
}

function renderParagraph(paragraph: Paragraph) {
  return <p>{renderLines(paragraph.lines)}</p>
}

function renderLines(lines: Line[]) {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      <span>{renderInline(line.chunks)}</span>
    </Fragment>
  ))
}

function renderList(list: List, key?: number) {
  const ListTag = list.indentType === "ordered" ? "ol" : "ul"
  return (
    <ListTag className={list.indentType} key={key}>
      {list.elts.map((elt, i) =>
        elt.type === "element" ? <li key={i}>{renderInline(elt.chunks)}</li> : renderList(elt, i),
      )}
    </ListTag>
  )
}

function renderTable(table: Table) {
  console.log(table.headers)
  return (
    <table className="kiwi-table">
      {table.title && <caption>{table.title}</caption>}
      {table.headers && (
        <thead>
          <tr className="header-row">
            {table.headers.cells.map((cell, i) => (
              <th key={i}>{renderLines(cell.content)}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {table.rows.map((row, i) => (
          <tr key={i}>
            {row.cells.map((cell, j) => (
              <td key={j}>{renderLines(cell.content)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function renderInline(chunks: (TextChunk | LinkChunk | FormatChunk)[]) {
  return chunks.map((chunk, i) => {
    if (chunk.type === "text") {
      return <Latex key={i}>{chunk.text}</Latex>
    }

    if (chunk.type === "link") {
      return (
        <a key={i} href={chunk.url}>
          {chunk.text}
        </a>
      )
    }

    if (chunk.type === "format") {
      const children = renderInline(chunk.chunks)
      switch (chunk.format) {
        case "bold":
          return <strong key={i}>{children}</strong>
        case "italic":
          return <em key={i}>{children}</em>
        case "underline":
          return <u key={i}>{children}</u>
        default:
          return <span key={i}>{children}</span>
      }
    }

    return null
  })
}

function renderMedia(media: Media) {
  const url = `${API_BASE_URL}/media/${media.filename}`

  const mediaElement = (() => {
    switch (media.mediaType) {
      case "image":
        return <img src={url} className="kiwi-image kiwi-media-elt" />
      case "video":
        return (
          <video controls className="kiwi-video kiwi-media-elt">
            <source src={url} type="video/mp4" />
          </video>
        )
      case "audio":
        return (
          <audio controls className="kiwi-audio kiwi-media-elt">
            <source src={url} type="audio/mpeg" />
          </audio>
        )
      default:
        return <></>
    }
  })()

  return (
    <div className="kiwi-media">
      {media.caption && <div className="kiwi-media-caption">{media.caption}</div>}
      {mediaElement}
    </div>
  )
}

export default Kiwi
