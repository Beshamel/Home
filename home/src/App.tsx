import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import "./App.css"
import Home from "./views/Home"
import Kiwi from "./views/Kiwi"
import KiwiEdit from "./views/KiwiEdit"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kiwi" element={<Navigate to="/kiwi/Kiwi" />} />
        <Route path="/kiwi/:title" element={<Kiwi />} />
        <Route path="/kiwi/:title/edit" element={<KiwiEdit />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
