import { useNavigate } from "react-router"
import { SearchBar } from "../components/Kiwi"
import { useRef, useState } from "react"

function KiwiHome() {
  const navigate = useNavigate()
  const [showSearchResults, setShowSearchResults] = useState(false)

  const searchRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="kiwi-home-page">
      <main
        className="kiwi-main"
        onClick={(e) => {
          e.stopPropagation()
          if (searchRef.current && !searchRef.current.contains(document.activeElement)) {
            setShowSearchResults(false)
          }
        }}
      >
        <h1 id="kiwi-home-page-title">{"Kiwi"}</h1>
        <SearchBar
          onPick={(result) => navigate(`/kiwi/${result.fTitle}`)}
          onFocus={() => setShowSearchResults(true)}
          searchRef={searchRef}
          hideResults={!showSearchResults}
          autofocus
        />
      </main>
    </div>
  )
}

export default KiwiHome
