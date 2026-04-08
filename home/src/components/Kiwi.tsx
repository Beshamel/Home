import { useState } from "react"
import type { KiwiPageData } from "../types"
import queryClient from "../api/client"

export const SearchBar = ({
  searchRef,
  onPick,
  onFocus,
  hideResults = false,
  autofocus = false,
  setTargetOnPick = false,
  setToTitleOnPick = false,
  setToFTitleOnPick = false,
  searchLimit = 5,
}: {
  searchRef?: React.RefObject<HTMLDivElement | null>
  onPick?: (result: KiwiPageData) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  hideResults?: boolean
  autofocus?: boolean
  setTargetOnPick?: boolean
  setToTitleOnPick?: boolean
  setToFTitleOnPick?: boolean
  searchLimit?: number
}) => {
  const [target, setTarget] = useState("")
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<KiwiPageData[]>([])

  const getSearchResults = async (e: React.ChangeEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value)
    const search = e.currentTarget.value.trim()
    if (!search.trim()) {
      setSearchResults([])
      return
    }
    try {
      const res = await queryClient.get<KiwiPageData[]>("/kiwi/search", {
        params: { query: search.trim(), limit: searchLimit },
      })
      setSearchResults(res.data)
    } catch (err) {
      console.error("Error searching Kiwi pages:", err)
    }
  }

  return (
    <div className="kiwi-search" ref={searchRef}>
      <input
        type="text"
        name="linkPage"
        placeholder="Search kiwi..."
        className={`kiwi-search-input${target ? " has-target" : ""}`}
        id="kiwi-search-input"
        autoFocus={autofocus}
        value={search}
        autoComplete="off"
        onChange={(e) => {
          setTarget("")
          getSearchResults(e)
        }}
        onFocus={onFocus}
      />
      {searchResults.length > 0 && !hideResults && (
        <div className="kiwi-search-results">
          {searchResults.map((result) => (
            <div key={result.fTitle} className="kiwi-search-result">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  if (onPick) {
                    onPick(result)
                  }
                  if (setToTitleOnPick) {
                    setSearch(result.title)
                  } else if (setToFTitleOnPick) {
                    setSearch(result.fTitle)
                  } else {
                    setSearch("")
                  }
                  if (setTargetOnPick) {
                    setTarget(result.fTitle)
                  }
                  setSearchResults([])
                }}
              >
                {result.title}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
