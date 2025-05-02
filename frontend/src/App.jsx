"use client"

import { useState, useEffect, useCallback } from "react"
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import SideBar from "./components/SideBar"
import PictogramGrid from "./components/PictogramGrid"
import DefaultPictogramGrid from "./components/DefaultPictogramGrid"
import PistaReproduccion from "./components/PistaReproduccion"
import TestElectronFileManager from "./components/TestElectronFileManager"
import { useSpeech } from "./hooks/useSpeech"
import { fetchFoldersByUser } from "./api"

function App() {
  const [userId, setUserId] = useState(1) // Default user
  const [activeFolder, setActiveFolder] = useState(null)
  const [queue, setQueue] = useState([])
  const [folders, setFolders] = useState([])
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [isElectronEnabled, setIsElectronEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState('folder') // 'folder' or 'default'

  const { speak } = useSpeech()

  // Check if Electron is available
  useEffect(() => {
    setIsElectronEnabled(window.electron !== undefined)
  }, [])

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
    setActiveTab('folder') // Reset to folder tab when changing user
  }

  const selectFolder = (folderId) => {
    console.log("Folder selected:", folderId)
    setActiveFolder(folderId)
    setActiveTab('folder') // Switch to folder tab when selecting a folder
  }

  const playPictogram = (pictogram) => {
    speak(pictogram.FRASE || pictogram.label)
  }

  const addToQueue = (pictogram) => {
    setQueue((prevQueue) => [...prevQueue, pictogram])
  }

  const updateQueue = useCallback((updatedQueue) => {
    setQueue(updatedQueue)
  }, [])

  const switchToDefaultPictograms = () => {
    setActiveTab('default')
  }

  useEffect(() => {
    loadFolders()
  }, [userId]) // Reload folders when user changes

  return (
    <Router>
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
            onShowDefaultPictograms={switchToDefaultPictograms}
            isElectronEnabled={isElectronEnabled}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-hidden flex flex-col">
            {/* Tab Navigation (when in Electron mode) */}
            {isElectronEnabled && (
              <div className="bg-white border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => activeFolder && setActiveTab('folder')}
                    className={`px-4 py-3 font-medium text-sm ${
                      activeTab === 'folder'
                        ? 'border-b-2 border-lime-500 text-lime-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    disabled={!activeFolder}
                  >
                    {currentFolder ? currentFolder.NOMBRE : "Select a folder"}
                  </button>
                  <button
                    onClick={() => setActiveTab('default')}
                    className={`px-4 py-3 font-medium text-sm ${
                      activeTab === 'default'
                        ? 'border-b-2 border-green-500 text-green-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Default Pictograms
                  </button>
                </div>
              </div>
            )}

            {/* Folder Title (when not showing tabs) */}
            {!isElectronEnabled && (
              <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  {currentFolder ? currentFolder.NOMBRE : "Select a folder"}
                  <span className="text-xs text-gray-500 ml-2">(ID: {activeFolder})</span>
                </h2>
                <div className="flex items-center">
                  {loadingFolders && <div className="text-sm text-gray-500 mr-4">Loading folders...</div>}
                </div>
              </div>
            )}

            {/* Pictogram Grids */}
            {activeTab === 'folder' ? (
              activeFolder ? (
                <PictogramGrid folderId={activeFolder} onPlayPictogram={playPictogram} onAddToQueue={addToQueue} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a folder to view its pictograms
                </div>
              )
            ) : (
              <DefaultPictogramGrid onSelectPictogram={playPictogram} onAddToQueue={addToQueue} />
            )}
          </main>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<DefaultPictogramGrid />} />
        <Route path="/test-electron" element={<TestElectronFileManager />} />
      </Routes>
    </Router>
  )
}

export default App
