import { useEffect, useRef, useState } from "react"
import type { QuickAccessLink } from "../types"
import queryClient from "../api/client"

function Home() {
  const [time, setTime] = useState(new Date())
  const [searchMode, setSearchMode] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const searchRef = useRef<HTMLInputElement | null>(null)

  const [quickAccessLinks, setQuickAccessLinks] = useState<QuickAccessLink[]>([])
  const [quickAccessString, setQuickAccessString] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    try {
      queryClient.get("/quick-access").then((res) => {
        setQuickAccessLinks(res.data)
      })
    } catch (e) {
      console.error("Failed to fetch quick access links", e)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (searchRef.current?.contains(document.activeElement)) {
        if (e.key === "Escape") {
          searchRef.current.blur()
        }
        if (e.key === "Tab") {
          e.preventDefault()
          setSearchMode((mode) => !mode)
        }
        return
      }

      if (e.key === "Tab") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [searchMode])

  useEffect(() => {
    if (searchMode) {
      const matches = quickAccessLinks.filter((l) =>
        l.shortcuts.some((s) => s.startsWith(quickAccessString.toLowerCase())),
      )
      if (matches.length === 1) {
        window.open(matches[0].url, "_blank")
        setQuickAccessString("")
      }
    }
  }, [quickAccessString, searchMode])

  const day = time.getDate()
  const month = time.getMonth() + 1
  const year = time.getFullYear()

  const timeH = time.getHours()
  const timeM = time.getMinutes()
  const timeS = time.getSeconds()

  return (
    <div className="home-page">
      <p className="home-clock">
        <span className="hm">
          {timeH < 10 ? `0${timeH}` : timeH}:{timeM < 10 ? `0${timeM}` : timeM}
        </span>
        <span className="s">{timeS < 10 ? `0${timeS}` : timeS}</span>
        <br />
        <span className="date">
          {`${day < 10 ? `0${day}` : day} / ${month < 10 ? `0${month}` : month} / ${year % 100 < 10 ? `0${year % 100}` : year % 100}`}
        </span>
      </p>
      <form
        className="search-form"
        action="https://www.google.com/search"
        method="get"
        role="search"
        onSubmit={(e) => {
          if (!e.currentTarget.q.value) {
            e.preventDefault()
          }
        }}
      >
        <input
          id="q"
          className={"search-input" + (searchMode ? " quick-access-mode" : "")}
          name="q"
          type="text"
          placeholder={searchMode ? "Quick access..." : "Search Google..."}
          value={searchMode ? quickAccessString : searchValue}
          onChange={(e) => {
            if (searchMode) {
              setQuickAccessString(e.target.value)
            } else {
              setSearchValue(e.target.value)
            }
          }}
          autoComplete="off"
          spellCheck={false}
          ref={searchRef}
        />
      </form>
    </div>
  )
}

export default Home
