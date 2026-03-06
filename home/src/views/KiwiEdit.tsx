import { useEffect, useState, useRef } from "react"
import type { KiwiPageData } from "../types"
import { useNavigate, useParams } from "react-router"
import queryClient from "../api/client"
import PopupMenu from "../components/PopupMenu"

function KiwiEdit() {
  const { title: f_title } = useParams<{ title: string }>()
  const navigate = useNavigate()

  const [pageContent, setPageContent] = useState<KiwiPageData | null>(null)

  const [fileUploaderOpen, setFileUploaderOpen] = useState(false)

  const [linkAdderOpen, setLinkAdderOpen] = useState(false)
  const [linkAdderMode, setLinkAdderMode] = useState<"external" | "kiwi">("external")
  const [linkAdderUrl, setLinkAdderUrl] = useState("")
  const [linkAdderText, setLinkAdderText] = useState("")
  const [linkAdderKiwiTarget, setLinkAdderKiwiTarget] = useState("")
  const [linkAdderKiwiSearch, setLinkAdderKiwiSearch] = useState("")
  const [linkAdderKiwiSearchResults, setLinkAdderKiwiSearchResults] = useState<KiwiPageData[]>([])
  const linkAdderSearchRef = useRef<HTMLDivElement | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    async function fetchPageContent() {
      try {
        const response = await queryClient.get<KiwiPageData>(`/kiwi`, {
          params: { f_title: f_title },
        })
        const data = response.data
        setPageContent(data)
      } catch (error) {
        console.error("Error fetching page content:", error)
      }
    }
    fetchPageContent()
  }, [f_title])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageContent((prev) => (prev ? { ...prev, title: e.target.value } : prev))
  }

  const handleRawContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPageContent((prev) => (prev ? { ...prev, rawContent: e.target.value } : prev))
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === "file") {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) return
        const filename = f_title || file.name || "pasted"
        const uploaded = await uploadFile(file, filename)
        if (!uploaded) return
        const mediaCode = `<M ${uploaded}>`

        insertAtCursor(mediaCode)

        break
      }
    }
  }

  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current
    if (!ta) return
    ta.focus()
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0
    let next = ""

    const insertedWithNativeUndo = document.execCommand("insertText", false, text)
    if (insertedWithNativeUndo) {
      next = ta.value
    } else {
      next = ta.value.slice(0, start) + text + ta.value.slice(end)
      ta.value = next
      const pos = start + text.length
      try {
        ta.setSelectionRange(pos, pos)
      } catch {
        ta.selectionStart = pos
        ta.selectionEnd = pos
      }
    }

    setPageContent((prevState) => (prevState ? { ...prevState, rawContent: next } : prevState))

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const ref = textareaRef.current
        if (ref) {
          const pos = start + text.length
          ref.focus()
          try {
            ref.setSelectionRange(pos, pos)
          } catch (err) {
            ref.selectionStart = ref.selectionEnd = pos
          }
        }
      })
    })
  }

  const handleOpenFileUploader = () => {
    setLinkAdderOpen(false)
    setFileUploaderOpen(true)
  }

  const handleOpenLinkAdder = () => {
    setFileUploaderOpen(false)
    setLinkAdderOpen(true)
  }

  const handleLinkAdderGetSearchResults = async (
    e: React.ChangeEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>,
  ) => {
    setLinkAdderKiwiSearch(e.currentTarget.value)
    const search = e.currentTarget.value.trim()
    if (!search.trim()) {
      setLinkAdderKiwiSearchResults([])
      return
    }
    try {
      const res = await queryClient.get<KiwiPageData[]>("/kiwi/search", {
        params: { query: search.trim(), limit: 5 },
      })
      setLinkAdderKiwiSearchResults(res.data)
    } catch (err) {
      console.error("Error searching Kiwi pages:", err)
    }
  }

  const savePage = async () => {
    if (!pageContent) return
    try {
      const res = await queryClient.put<KiwiPageData>("/kiwi", null, {
        params: {
          f_title: f_title,
          title: pageContent.title,
          raw_content: pageContent.rawContent,
        },
      })
      navigate(`/kiwi/${res.data.fTitle}`)
    } catch (error) {
      console.error("Error saving page content:", error)
      alert("Failed to save page content.")
    }
  }

  const uploadFile = async (file: File, originalFilename: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("original_filename", originalFilename)
    try {
      const res = await queryClient.post("/media", formData)
      const filename = res.data.filename
      return filename
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Failed to upload file.")
      return null
    }
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    await savePage()
  }

  const handleCancel = () => {
    navigate(`/kiwi/${f_title}`)
  }

  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && key === "s" && !fileUploaderOpen && !linkAdderOpen) {
        e.preventDefault()
        await savePage()
      }
      if (key === "escape") {
        e.preventDefault()
        setFileUploaderOpen(false)
        setLinkAdderOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [pageContent, f_title])

  return (
    <div className="kiwi-page">
      <PopupMenu open={fileUploaderOpen} onClose={() => setFileUploaderOpen(false)}>
        <h2>{"Upload media"}</h2>
        <form
          id="kiwi-file-upload-form"
          onSubmit={async (e) => {
            e.preventDefault()
            const form = e.currentTarget as HTMLFormElement
            const fileInput = form.elements.namedItem("file") as HTMLInputElement | null
            const filenameInput = form.elements.namedItem("originalFilename") as HTMLInputElement | null
            const file = fileInput?.files?.[0] ?? null
            const original = filenameInput?.value?.trim()
            const filename = original || f_title || file?.name || "untitled"
            if (file) {
              const filename_ = await uploadFile(file, filename)
              if (filename_) {
                const captionInput = form.elements.namedItem("caption") as HTMLInputElement | null
                const caption = captionInput?.value?.trim()
                const mediaCode = caption ? `<M ${caption} : ${filename_}>` : `<M ${filename_}>`
                insertAtCursor(mediaCode)
                setFileUploaderOpen(false)
              } else {
                alert("Failed to upload file.")
              }
            }
          }}
        >
          <input id="kiwi-file-upload-form-file" type="file" name="file" /> <br />
          <input type="text" name="originalFilename" placeholder="Filename (optional)" />
          <br />
          <input type="text" name="caption" placeholder="Caption (optional)" />
          <br />
          <button
            type="submit"
            disabled={!(document.getElementById("kiwi-file-upload-form-file") as HTMLInputElement)?.files?.[0]}
          >
            {"Upload"}
          </button>
          <button type="button" onClick={() => setFileUploaderOpen(false)}>
            {"Cancel"}
          </button>
        </form>
      </PopupMenu>
      <PopupMenu
        open={linkAdderOpen}
        onClose={() => setLinkAdderOpen(false)}
        onClick={() => {
          if (linkAdderSearchRef.current && !linkAdderSearchRef.current.contains(document.activeElement)) {
            setLinkAdderKiwiSearchResults([])
          }
        }}
      >
        <h2>{"Add link"}</h2>
        <div className="option-selector">
          <button className={linkAdderMode === "external" ? "active" : ""} onClick={() => setLinkAdderMode("external")}>
            {"External"}
          </button>
          <button className={linkAdderMode === "kiwi" ? "active" : ""} onClick={() => setLinkAdderMode("kiwi")}>
            {"Kiwi page"}
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (linkAdderMode === "external" ? !linkAdderUrl : !linkAdderKiwiTarget) return
            const url = linkAdderMode === "external" ? linkAdderUrl : linkAdderKiwiTarget
            const text = linkAdderText.trim()
            if (!url) return
            const linkCode = text ? `<a ${url} | ${text} >` : `<a ${url}>`
            insertAtCursor(linkCode)
            setLinkAdderOpen(false)
            setLinkAdderText("")
          }}
        >
          {linkAdderMode === "external" ? (
            <>
              <input
                type="text"
                name="linkURL"
                placeholder="URL"
                value={linkAdderUrl}
                onChange={(e) => setLinkAdderUrl(e.target.value.trim())}
                autoComplete="off"
              />
              <br />
            </>
          ) : (
            <div className="kiwi-search" ref={linkAdderSearchRef}>
              <input
                type="text"
                name="linkPage"
                placeholder="Kiwi page title"
                className={`kiwi-search-input${linkAdderKiwiTarget ? " has-target" : ""}`}
                id="kiwi-search-input"
                value={linkAdderKiwiSearch}
                autoComplete="off"
                onChange={(e) => {
                  setLinkAdderKiwiTarget("")
                  handleLinkAdderGetSearchResults(e)
                }}
                onFocus={handleLinkAdderGetSearchResults}
              />
              {linkAdderKiwiSearchResults.length > 0 && (
                <div className="kiwi-search-results">
                  {linkAdderKiwiSearchResults.map((result) => (
                    <div key={result.fTitle} className="kiwi-search-result">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setLinkAdderKiwiSearch(result.fTitle)
                          setLinkAdderText(result.title)
                          setLinkAdderKiwiTarget(result.fTitle)
                          setLinkAdderKiwiSearchResults([])
                        }}
                      >
                        {result.title}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <input
            type="text"
            name="linkText"
            placeholder="Link text (optional)"
            value={linkAdderText}
            onChange={(e) => setLinkAdderText(e.target.value)}
          />
          <br />
          <button type="submit" disabled={linkAdderMode === "external" ? !linkAdderUrl : !linkAdderKiwiTarget}>
            {"Add"}
          </button>
          <button type="button" onClick={() => setLinkAdderOpen(false)}>
            {"Cancel"}
          </button>
        </form>
      </PopupMenu>
      <form className="kiwi-edit-form" onSubmit={handleSubmit}>
        <div>
          <button type="submit">{"Save"}</button>
          <button type="button" onClick={handleCancel}>
            {"Cancel"}
          </button>
          <button type="button" onClick={handleOpenFileUploader}>
            {"Upload media..."}
          </button>
          <button type="button" onClick={handleOpenLinkAdder}>
            {"Add link..."}
          </button>
        </div>
        <input className="title-input" type="text" value={pageContent?.title || ""} onChange={handleTitleChange} />
        <textarea
          ref={textareaRef}
          className="raw-content-input"
          value={pageContent?.rawContent || ""}
          onChange={handleRawContentChange}
          onPaste={handlePaste}
        />
      </form>
    </div>
  )
}

export default KiwiEdit
