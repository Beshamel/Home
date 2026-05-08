import { useEffect, useRef, useState } from "react"
import type { KiwiPageData, QuickAccessLink } from "../types"
import queryClient from "../api/client"
import { LocalTimeMode, LocalUTC, LocalDisplaySeconds } from "../api/localStorage"
import { useNavigate } from "react-router"

const maxSuggestions = 5

function Home() {
  const navigate = useNavigate()

  const [time, setTime] = useState(new Date())
  const [searchMode, setSearchMode] = useState(0)
  const [searchValue, setSearchValue] = useState("")
  const searchRef = useRef<HTMLInputElement | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)

  const [kiwiSuggestions, setKiwiSuggestions] = useState<KiwiPageData[]>([])

  const [googleSuggestions, setGoogleSuggestions] = useState<string[]>([])
  const [suggestionIndex, setSuggestionIndex] = useState(-1)

  const [quickAccessLinks, setQuickAccessLinks] = useState<QuickAccessLink[]>([])
  const [quickAccessRouting, setQuickAccessRouting] = useState(false)

  const [timeFormat, setTimeFormat] = useState<string>(LocalTimeMode.get()!)
  const [timeUTC, setTimeUTC] = useState(LocalUTC.get() === "true")
  const [displaySeconds, setDisplaySeconds] = useState(LocalDisplaySeconds.get() === "true")

  const refreshTime = () => {
    setTime(new Date())
  }

  useEffect(() => {
    setSuggestionIndex(-1)
  }, [searchValue, googleSuggestions, searchMode])

  useEffect(() => {
    const interval = setInterval(() => {
      refreshTime()
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
          setSearchMode((mode) => (mode + 1) % 3)
        }
        if (e.key === "ArrowDown") {
          e.preventDefault()
          if (searchMode === 1 && googleSuggestions.length > 0) {
            setSuggestionIndex((index) => (index + 1) % Math.min(googleSuggestions.length, maxSuggestions))
          }
          if (searchMode === 2 && kiwiSuggestions.length > 0) {
            setSuggestionIndex((index) => (index + 1) % Math.min(kiwiSuggestions.length, maxSuggestions))
          }
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          if (searchMode === 1 && googleSuggestions.length > 0) {
            setSuggestionIndex(
              (index) =>
                (index - 1 + Math.min(googleSuggestions.length, maxSuggestions)) %
                Math.min(googleSuggestions.length, maxSuggestions),
            )
          }
          if (searchMode === 2 && kiwiSuggestions.length > 0) {
            setSuggestionIndex(
              (index) =>
                (index - 1 + Math.min(kiwiSuggestions.length, maxSuggestions)) %
                Math.min(kiwiSuggestions.length, maxSuggestions),
            )
          }
        }
        return
      }

      if (e.key === "Tab") {
        e.preventDefault()
        searchRef.current?.focus()
      }

      if (e.key === "z") {
        LocalUTC.set(timeUTC ? "false" : "true")
        setTimeUTC((t) => !t)
        refreshTime()
      }

      if (e.key === "x") {
        const newTimeFormat = timeFormat === "24h" ? "12h" : "24h"
        LocalTimeMode.set(newTimeFormat)
        setTimeFormat(newTimeFormat)
        refreshTime()
      }

      if (e.key === "s") {
        LocalDisplaySeconds.set(displaySeconds ? "false" : "true")
        setDisplaySeconds((d) => !d)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [timeUTC, timeFormat, displaySeconds, searchMode, googleSuggestions, kiwiSuggestions])

  useEffect(() => {
    if (quickAccessRouting) return
    if (searchMode === 0) {
      const matches = quickAccessLinks.filter((l) => l.shortcuts.some((s) => s.startsWith(searchValue.toLowerCase())))
      if (matches.length === 1) {
        window.location.href = matches[0].url
        setSearchValue(matches[0].dname)
        setQuickAccessRouting(true)
      }
    }
    if (searchMode === 1) {
      if (searchValue.trim() === "") {
        setGoogleSuggestions([])
        return
      }
      queryClient
        .get("/google/suggestions", {
          params: {
            q: searchValue,
          },
        })
        .then((res) => {
          setGoogleSuggestions(res.data)
        })
        .catch((e) => {
          console.error("Failed to fetch Google suggestions", e)
        })
    }
    if (searchMode === 2) {
      if (searchValue.trim() === "") {
        setKiwiSuggestions([])
        return
      }
      queryClient
        .get<KiwiPageData[]>("/kiwi/search", {
          params: { query: searchValue.trim(), limit: maxSuggestions },
        })
        .then((res) => {
          setKiwiSuggestions(res.data)
        })
        .catch((e) => {
          console.error("Failed to search Kiwi", e)
        })
    }
  }, [searchValue, searchMode])

  const displayedTime = timeUTC ? new Date(time.getTime() + time.getTimezoneOffset() * 60000) : time

  const day = displayedTime.getDate()
  const month = displayedTime.getMonth() + 1
  const year = displayedTime.getFullYear()

  let timeH = displayedTime.getHours()
  const ampm = timeH >= 12 ? "PM" : "AM"
  if (timeFormat === "12h") {
    if (timeH === 0) {
      timeH = 12
    } else if (timeH > 12) {
      timeH = timeH - 12
    }
  }
  const timeM = displayedTime.getMinutes()
  const timeS = displayedTime.getSeconds()

  return (
    <div className="home-page">
      <p className="home-clock">
        <span className="hm">
          {timeH < 10 ? `0${timeH}` : timeH}:{timeM < 10 ? `0${timeM}` : timeM}
        </span>
        {displaySeconds && <span className="s">{timeS < 10 ? `0${timeS}` : timeS}</span>}
        {timeFormat === "12h" && <span className="ampm">{ampm}</span>}
        {timeUTC && <span className="utc">{"Z"}</span>}
        <br />
        <span className="date">
          {`${day < 10 ? `0${day}` : day} / ${month < 10 ? `0${month}` : month} / ${year % 100 < 10 ? `0${year % 100}` : year % 100}`}
        </span>
      </p>
      <form
        className="home-search-form"
        action="https://www.google.com/search"
        method="get"
        role="search"
        ref={formRef}
        onSubmit={(e) => {
          if (searchMode === 1 && suggestionIndex != -1) {
            const suggestion = googleSuggestions[suggestionIndex]
            setSearchValue(suggestion)
            searchRef.current && (searchRef.current.value = suggestion)
          }
          if (searchMode === 2) {
            e.preventDefault()
            if (kiwiSuggestions.length) {
              const suggestion = kiwiSuggestions[0]
              setSearchValue(suggestion.title)
              navigate(`kiwi/${suggestion.fTitle}`)
            }
          }
          if (!e.currentTarget.q.value) {
            e.preventDefault()
          }
        }}
      >
        <input
          id="q"
          className={
            "search-input" +
            (searchMode === 0 ? " quick-access-mode" : searchMode === 1 ? " google-search-mode" : " kiwi-search-mode")
          }
          name="q"
          type="text"
          placeholder={searchMode === 0 ? "Quick access..." : searchMode === 1 ? "Search Google..." : "Search Kiwi..."}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value)
          }}
          autoComplete="off"
          spellCheck={false}
          autoFocus
          disabled={quickAccessRouting}
          ref={searchRef}
        />
        {searchMode === 1 && googleSuggestions.length > 0 && (
          <div className="google-suggestions">
            {googleSuggestions.slice(0, maxSuggestions).map((suggestion, index) => (
              <div
                key={index}
                className={`google-suggestion${index === suggestionIndex ? " selected" : ""}`}
                onMouseEnter={() => {
                  setSuggestionIndex(index)
                }}
                onClick={() => {
                  setSearchValue(suggestion)
                  searchRef.current && (searchRef.current.value = suggestion)
                  formRef.current?.requestSubmit()
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
        {searchMode === 2 && kiwiSuggestions.length > 0 && (
          <div className="kiwi-suggestions">
            {kiwiSuggestions.slice(0, maxSuggestions).map((suggestion, index) => (
              <div
                key={index}
                className={`kiwi-suggestion${index === suggestionIndex ? " selected" : ""}`}
                onMouseEnter={() => {
                  setSuggestionIndex(index)
                }}
                onClick={() => {
                  setSearchValue(suggestion.title)
                  navigate(`kiwi/${suggestion.fTitle}`)
                }}
              >
                {suggestion.title}
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}

export default Home
