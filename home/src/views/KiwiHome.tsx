import { useNavigate } from "react-router"
import { SearchBar } from "../components/Kiwi"
import { useRef, useState } from "react"
import PopupMenu from "../components/PopupMenu"
import queryClient from "../api/client"
import type { KiwiPageData } from "../types"

function KiwiHome() {
  const navigate = useNavigate()
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [newPageMenuOpen, setNewPageMenuOpen] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState("")

  const searchRef = useRef<HTMLInputElement | null>(null)

  const handleCreatePage = async (e: React.SubmitEvent) => {
    e.preventDefault()
    try {
      const page = await queryClient.post<KiwiPageData>("/kiwi", null, {
        params: {
          title: newPageTitle,
          raw_content: `# ${newPageTitle}\n\n`,
        },
      })
      navigate(`/kiwi/${page.data.fTitle}/edit`)
    } catch (error) {
      console.error("Error creating page:", error)
      alert("Failed to create page.")
    }
  }

  return (
    <div className="kiwi-home-page kiwi-page">
      <PopupMenu open={newPageMenuOpen} onClose={() => setNewPageMenuOpen(false)}>
        <h2>{"Create New Page"}</h2>
        <form className="kiwi-create-form" onSubmit={handleCreatePage}>
          <input
            className="title-input"
            type="text"
            value={newPageTitle}
            onChange={(e) => {
              setNewPageTitle(e.target.value)
            }}
          />
          <br />
          <button type="submit">{"Submit"}</button>
        </form>
      </PopupMenu>
      <main
        className="kiwi-main home"
        onClick={(e) => {
          e.stopPropagation()
          if (searchRef.current && !searchRef.current.contains(document.activeElement)) {
            setShowSearchResults(false)
          }
        }}
      >
        <div className="kiwi-home-container">
          <h1 id="kiwi-home-page-title">{"Kiwi"}</h1>
          <SearchBar
            onPick={(result) => navigate(`/kiwi/${result.fTitle}`)}
            onFocus={() => setShowSearchResults(true)}
            searchRef={searchRef}
            hideResults={!showSearchResults}
            autofocus
          />
          <button onClick={() => setNewPageMenuOpen((open) => !open)}>{"New Page"}</button>
        </div>
      </main>
    </div>
  )
}

export default KiwiHome
