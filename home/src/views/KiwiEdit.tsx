import { useEffect, useState, useRef } from "react"
import type { KiwiPageData } from "../types"
import { useNavigate, useParams } from "react-router"
import queryClient from "../api/client"

function KiwiEdit() {
  const { title: f_title } = useParams<{ title: string }>()
  const navigate = useNavigate()

  const [pageContent, setPageContent] = useState<KiwiPageData | null>(null)
  const [fileUploaderOpen, setFileUploaderOpen] = useState(false)
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
        const ta = e.currentTarget
        const start = ta.selectionStart ?? 0
        const end = ta.selectionEnd ?? 0
        const filename = f_title || file.name || "pasted"
        const uploaded = await uploadFile(file, filename)
        if (!uploaded) return
        const mediaCode = `<M ${uploaded}>`

        let next = ""
        ta.focus()
        try {
          ta.setSelectionRange(start, end)
        } catch {
          ta.selectionStart = start
          ta.selectionEnd = end
        }

        const insertedWithNativeUndo = document.execCommand("insertText", false, mediaCode)
        if (insertedWithNativeUndo) {
          next = ta.value
        } else {
          next = ta.value.slice(0, start) + mediaCode + ta.value.slice(end)
          ta.value = next
          const pos = start + mediaCode.length
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
              const pos = start + mediaCode.length
              ref.focus()
              try {
                ref.setSelectionRange(pos, pos)
              } catch (err) {
                ref.selectionStart = ref.selectionEnd = pos
              }
            }
          })
        })
        break
      }
    }
  }

  const handleOpenFileUploader = () => {
    setFileUploaderOpen(true)
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
      const mediaCode = `<M ${filename}>`
      window.navigator.clipboard.writeText(mediaCode)
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
      if ((e.ctrlKey || e.metaKey) && key === "s" && !fileUploaderOpen) {
        e.preventDefault()
        await savePage()
      }
      if (key === "escape") {
        e.preventDefault()
        setFileUploaderOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [pageContent, f_title])

  return (
    <div className="kiwi-page">
      {fileUploaderOpen && (
        <div className="kiwi-file-uploader-wrapper">
          <div className="kiwi-file-uploader">
            <h2>{"Upload media"}</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const form = e.currentTarget as HTMLFormElement
                const fileInput = form.elements.namedItem("file") as HTMLInputElement | null
                const filenameInput = form.elements.namedItem("originalFilename") as HTMLInputElement | null
                const file = fileInput?.files?.[0] ?? null
                const original = filenameInput?.value?.trim()
                const filename = original || f_title || file?.name || "untitled"
                if (file) {
                  await uploadFile(file, filename)
                }
                setFileUploaderOpen(false)
              }}
            >
              <input type="file" name="file" /> <br />
              <input type="text" name="originalFilename" placeholder="Filename" />
              <br />
              <button type="submit">{"Upload"}</button>
              <button type="button" onClick={() => setFileUploaderOpen(false)}>
                {"Cancel"}
              </button>
            </form>
          </div>
        </div>
      )}
      <form className="kiwi-edit-form" onSubmit={handleSubmit}>
        <div>
          <button type="submit">{"Save"}</button>
          <button type="button" onClick={handleCancel}>
            {"Cancel"}
          </button>
          <button type="button" onClick={handleOpenFileUploader}>
            {"Upload media..."}
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
