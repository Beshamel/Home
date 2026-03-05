import { useEffect, useRef, useState } from "react"
import type { QuickAccessLink } from "../types"
import queryClient from "../api/client"
import { LocalTimeMode, LocalUTC, LocalDisplaySeconds } from "../api/localStorage"

function Home() {
  const [time, setTime] = useState(new Date())
  const [searchMode, setSearchMode] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const searchRef = useRef<HTMLInputElement | null>(null)

  const [quickAccessLinks, setQuickAccessLinks] = useState<QuickAccessLink[]>([])

  const [timeFormat, setTimeFormat] = useState<string>(LocalTimeMode.get()!)
  const [timeUTC, setTimeUTC] = useState(LocalUTC.get() === "true")
  const [displaySeconds, setDisplaySeconds] = useState(LocalDisplaySeconds.get() === "true")

  const refreshTime = () => {
    setTime(new Date())
  }

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
          setSearchMode((mode) => !mode)
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
  }, [searchMode, timeUTC, timeFormat])

  useEffect(() => {
    if (searchMode) {
      const matches = quickAccessLinks.filter((l) => l.shortcuts.some((s) => s.startsWith(searchValue.toLowerCase())))
      if (matches.length === 1) {
        window.location.href = matches[0].url
        setSearchValue("")
      }
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
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value)
          }}
          autoComplete="off"
          spellCheck={false}
          autoFocus
          ref={searchRef}
        />
      </form>
    </div>
  )
}

export default Home
