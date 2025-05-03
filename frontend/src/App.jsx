"use client"

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import HomePage from "./pages/HomePage"
import AboutPage from "./pages/AboutPage"
import "./App.css"

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen w-screen overflow-hidden">
        {/* Navegación principal - reducida en altura */}
        <nav className="bg-blue-600 text-white py-2">
          <div className="flex justify-between items-center px-4">
            <div className="text-xl font-bold">Picto Audios</div>
            <ul className="flex space-x-6">
              <li>
                <Link to="/" className="hover:text-blue-200 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-200 transition-colors">
                  Acerca de
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Contenido principal - aprovecha todo el espacio disponible */}
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
