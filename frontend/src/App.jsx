"use client"

import { useState, useEffect } from "react"
import SideBar from "./components/SideBar"
import PictogramGrid from "./components/PictogramGrid"
import PistaReproduccion from "./components/PistaReproduccion"
import { useSpeech } from "./hooks/useSpeech"
import { fetchFoldersByUser } from "./api"

function App() {
  const [userId, setUserId] = useState(1) // Default user
  const [activeFolder, setActiveFolder] = useState(null)
  const [queue, setQueue] = useState([])
  const [folders, setFolders] = useState([])
  const [loadingFolders, setLoadingFolders] = useState(true)

  const { speak } = useSpeech()

  const currentFolder =
    folders.length && activeFolder ? folders.find((folder) => folder.COD_CARPETA == activeFolder) : null

  const loadFolders = async () => {
    try {
      setLoadingFolders(true)
      const response = await fetchFoldersByUser(userId)
      console.log("Folders loaded:", response)

      if (Array.isArray(response)) {
        setFolders(response)
        // Set the first folder as active if none is selected
        if (!activeFolder && response.length > 0) {
          setActiveFolder(response[0].COD_CARPETA)
          console.log("Initial folder selected:", response[0].COD_CARPETA)
        }
      } else {
        console.error("Response is not an array:", response)
        setFolders([])
      }
    } catch (error) {
      console.error("Error loading folders:", error)
      setFolders([])
    } finally {
      setLoadingFolders(false)
    }
  }

  const changeUser = (newUserId) => {
    console.log("Changing to user:", newUserId)
    setUserId(newUserId)
    setActiveFolder(null) // Reset selected folder
    setQueue([]) // Reset queue when changing user
  }

  const selectFolder = (folderId) => {
    console.log("Folder selected:", folderId)
    setActiveFolder(folderId)
  }

  const playPictogram = (pictogram) => {
    speak(pictogram.FRASE || pictogram.label)
  }

  const addToQueue = (pictogram) => {
    setQueue((prevQueue) => [...prevQueue, pictogram])
  }

  const updateQueue = (updatedQueue) => {
    setQueue(updatedQueue)
  }

  useEffect(() => {
    loadFolders()
  }, [userId]) // Reload folders when user changes

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <PistaReproduccion queue={queue} onUpdateQueue={updateQueue} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SideBar
          userId={userId}
          selectedFolder={activeFolder}
          onSelectFolder={selectFolder}
          onChangeUser={changeUser}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Folder Title */}
          <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {currentFolder ? currentFolder.NOMBRE : "Select a folder"}
              <span className="text-xs text-gray-500 ml-2">(ID: {activeFolder})</span>
            </h2>
            <div className="flex items-center">
              {loadingFolders && <div className="text-sm text-gray-500 mr-4">Loading folders...</div>}
              <a
                href="/diagnostico"
                target="_blank"
                title="Diagnostic Tool"
                className="text-sm text-blue-500 hover:text-blue-700"
                rel="noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Pictogram Grid */}
          {activeFolder ? (
            <PictogramGrid folderId={activeFolder} onPlayPictogram={playPictogram} onAddToQueue={addToQueue} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a folder to view its pictograms
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
