import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import type { QuickAccessLink } from "../types"
import queryClient from "../api/client"

import HomeIcon from "../assets/svg/home.svg"
import CrossIcon from "../assets/svg/cross.svg"
import EditIcon from "../assets/svg/edit.svg"

function HomeSettings() {
  const [quickAccessLinks, setQuickAccessLinks] = useState<QuickAccessLink[]>([])
  const [newLinkDname, setNewLinkDname] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    try {
      queryClient.get("/quick-access").then((res) => {
        setQuickAccessLinks(res.data)
      })
    } catch (e) {
      console.error("Failed to fetch quick access links", e)
    }
  }, [])

  return (
    <div className="home-settings">
      <main>
        <h1>Settings</h1>
        <div className="setting-container">
          <h2>Quick access links</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              queryClient
                .post("/quick-access", null, {
                  params: { dname: newLinkDname, url: newLinkUrl },
                })
                .then((res) => {
                  setQuickAccessLinks([...quickAccessLinks, res.data])
                  setNewLinkDname("")
                  setNewLinkUrl("")
                })
            }}
          >
            <input
              type="text"
              placeholder="Site name"
              value={newLinkDname}
              onChange={(e) => setNewLinkDname(e.target.value)}
            />
            <input type="text" placeholder="URL" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} />
            <button type="submit">Add</button>
          </form>
          {quickAccessLinks
            .sort((a, b) => a.dname.localeCompare(b.dname))
            .map((link, k) => (
              <div className="quick-access-link-setting" key={k}>
                <p style={{ fontWeight: "bold" }}>
                  <InlineButton
                    icon={CrossIcon}
                    onClick={() => {
                      queryClient
                        .delete("/quick-access", {
                          params: { url: link.url },
                        })
                        .then(() => {
                          setQuickAccessLinks(quickAccessLinks.filter((l) => l.url !== link.url))
                        })
                    }}
                    className="alert"
                  />
                  <InlineButton
                    icon={EditIcon}
                    onClick={() => {
                      const newDname = prompt("Enter new site name", link.dname)
                      const newUrl = prompt("Enter new URL", link.url)
                      if (newDname && newUrl) {
                        queryClient
                          .put("/quick-access", null, {
                            params: { dname: newDname, url: newUrl, oldUrl: link.url },
                          })
                          .then((res) => {
                            const updatedLinks = quickAccessLinks.map((l) => {
                              if (l.url === link.url) {
                                return res.data
                              } else {
                                return l
                              }
                            })
                            setQuickAccessLinks(updatedLinks)
                          })
                      }
                    }}
                  />
                  <span style={{ marginLeft: "5px" }} />
                  {link.dname} : <a href={link.url}>{link.url}</a>
                </p>
                {link.shortcuts.map((shortcut, k) => (
                  <p style={{ marginLeft: "35px" }} key={k}>
                    <InlineButton
                      icon={CrossIcon}
                      onClick={() => {
                        queryClient
                          .delete("/quick-access/shortcut", {
                            params: { url: link.url, shortcut },
                          })
                          .then((res) => {
                            const updatedLinks = quickAccessLinks.map((l) => {
                              if (l.url === link.url) {
                                return res.data
                              } else {
                                return l
                              }
                            })
                            setQuickAccessLinks(updatedLinks)
                          })
                      }}
                      className="alert"
                    />
                    <span style={{ marginLeft: "5px" }} />
                    {shortcut}
                  </p>
                ))}
                <div style={{ marginLeft: "35px" }}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      queryClient
                        .post("/quick-access/shortcut", null, {
                          params: { url: link.url, shortcut: e.currentTarget.shortcut.value },
                        })
                        .then((res) => {
                          const updatedLinks = quickAccessLinks.map((l) => {
                            if (l.url === link.url) {
                              return res.data
                            } else {
                              return l
                            }
                          })
                          setQuickAccessLinks(updatedLinks)
                        })
                    }}
                  >
                    <input type="text" name="shortcut" placeholder="Add shortcut" />
                    <button className="new-shortcut-submit" type="submit">
                      Add
                    </button>
                  </form>
                </div>
              </div>
            ))}
        </div>
      </main>
      <button className="iconbutton" onClick={() => navigate("/")}>
        <img src={HomeIcon} height="30px" />
      </button>
    </div>
  )
}

function InlineButton({ icon, onClick, className }: { icon: string; onClick: () => void; className?: string }) {
  return (
    <button className={`inline-button ${className || ""}`} onClick={onClick}>
      <img src={icon} />
    </button>
  )
}

export default HomeSettings
