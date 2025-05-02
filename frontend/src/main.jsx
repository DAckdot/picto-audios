import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SystemPictogramsPage from "./pages/SystemPictogramsPage";

// Detect browser language and configure default voice
const synth = window.speechSynthesis
synth.onvoiceschanged = () => {
  const voices = synth.getVoices()
  const spanishVoice =
    voices.find((voice) => voice.lang === "es-419") || voices.find((voice) => voice.lang.startsWith("es"))
  if (spanishVoice) {
    console.log(`Default voice configured: ${spanishVoice.name} (${spanishVoice.lang})`)
  } else {
    console.warn("No Spanish voice found. Using browser default voice.")
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/system-pictograms" element={<SystemPictogramsPage />} />
        <Route path="/" element={<App />} />
      </Routes>
    </Router>
  </React.StrictMode>,
)
