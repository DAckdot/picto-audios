import { useState, useEffect, useCallback, useRef } from "react"
import SideBar from "../components/SideBar"
import PictogramGrid from "../components/PictogramGrid"
import PistaReproduccion from "../components/PistaReproduccion"
import { useSpeech } from "../hooks/useSpeech"
import { fetchFoldersByUser } from "../api"

function HomePage() {
  const [userId, setUserId] = useState(1) // Default user
  const [activeFolder, setActiveFolder] = useState(null)
  const [queue, setQueue] = useState([])
  const [folders, setFolders] = useState([])
  const [loadingFolders, setLoadingFolders] = useState(true)
  
  // Referencia para almacenar la función envuelta que viene de PistaReproduccion
  const wrappedAddToQueueRef = useRef(null)

  const { speak } = useSpeech()

  const currentFolder =
    folders.length && activeFolder ? folders.find((folder) => folder.COD_CARPETA == activeFolder) : null

  const loadFolders = useCallback(async () => {
    try {
      setLoadingFolders(true)
      const response = await fetchFoldersByUser(userId)
      console.log("Carpetas cargadas:", response)

      if (Array.isArray(response)) {
        setFolders(response)
        // Set the first folder as active if none is selected
        if (!activeFolder && response.length > 0) {
          setActiveFolder(response[0].COD_CARPETA)
          console.log("Carpeta inicial seleccionada:", response[0].COD_CARPETA)
        }
      } else {
        console.error("La respuesta no es un array:", response)
        setFolders([])
      }
    } catch (error) {
      console.error("Error al cargar carpetas:", error)
      setFolders([])
    } finally {
      setLoadingFolders(false)
    }
  }, [userId]) // Eliminada la dependencia activeFolder

  const changeUser = (newUserId) => {
    console.log("Cambiando al usuario:", newUserId)
    setUserId(newUserId)
    setActiveFolder(null) // Reset selected folder
    setQueue([]) // Reset queue when changing user
  }

  const selectFolder = (folderId) => {
    console.log("Carpeta seleccionada:", folderId)
    setActiveFolder(folderId)
  }

  const playPictogram = (pictogram) => {
    speak(pictogram.FRASE || pictogram.label)
  }

  // Función para recibir la referencia a wrappedAddToQueue desde PistaReproduccion
  const handleWrappedAddToQueue = useCallback((wrappedFunc) => {
    wrappedAddToQueueRef.current = wrappedFunc;
  }, []);
  
  // Función de adición a la cola que usa la versión envuelta si está disponible
  const addToQueue = useCallback((pictogram) => {
    if (wrappedAddToQueueRef.current) {
      // Si tenemos la función envuelta, la usamos para evitar bucles
      wrappedAddToQueueRef.current(pictogram);
    } else {
      // Fallback a la implementación tradicional
      setQueue((prevQueue) => [...prevQueue, pictogram]);
    }
  }, []);

  const updateQueue = (updatedQueue) => {
    setQueue(updatedQueue)
  }

  useEffect(() => {
    loadFolders()
  }, [loadFolders]) // Reload folders when user changes

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <PistaReproduccion 
        queue={queue} 
        onUpdateQueue={updateQueue} 
        onWrappedAddToQueue={handleWrappedAddToQueue}
      />

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
              {currentFolder ? currentFolder.NOMBRE : "Selecciona una carpeta"}
              <span className="text-xs text-gray-500 ml-2">(ID: {activeFolder})</span>
            </h2>
            <div className="flex items-center">
              {loadingFolders && <div className="text-sm text-gray-500 mr-4">Cargando carpetas...</div>}
            </div>
          </div>

          {/* Pictogram Grid */}
          {activeFolder ? (
            <PictogramGrid folderId={activeFolder} onPlayPictogram={playPictogram} onAddToQueue={addToQueue} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Selecciona una carpeta para ver sus pictogramas
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default HomePage