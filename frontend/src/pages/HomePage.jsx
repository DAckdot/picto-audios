import { useState, useEffect, useCallback, useRef } from "react"
import SideBar from "../components/SideBar"
import PictogramGrid from "../components/PictogramGrid"
import PistaReproduccion from "../components/PistaReproduccion"
import { useSpeech } from "../hooks/useSpeech"
import { fetchFoldersByUser } from "../api"
import systemPictograms from "../data/systemPictograms.json"
import PictogramCard from "../components/PictogramCard"
import PictogramSearch from "../components/PictogramSearch"

// Función para obtener URL de las imágenes
const getImageUrl = (name) => {
  return new URL(`../assets/${name}.png`, import.meta.url).href;
};

// Identificador especial para la carpeta de pictogramas del sistema
const SYSTEM_PICTOGRAMS_ID = "system"

function HomePage() {
  const [userId, setUserId] = useState(1) // Default user
  const [activeFolder, setActiveFolder] = useState(null)
  const [queue, setQueue] = useState([])
  const [folders, setFolders] = useState([])
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [systemPictogramsList, setSystemPictogramsList] = useState([])
  const [filteredSystemPictograms, setFilteredSystemPictograms] = useState([])
  const [loadingSystemPictograms, setLoadingSystemPictograms] = useState(false)
  
  // Referencia para almacenar la función envuelta que viene de PistaReproduccion
  const wrappedAddToQueueRef = useRef(null)

  const { speak } = useSpeech()

  // Determina la carpeta actual o si estamos mostrando pictogramas del sistema
  const currentFolder = activeFolder === SYSTEM_PICTOGRAMS_ID
    ? { NOMBRE: "Pictogramas por defecto", COD_CARPETA: SYSTEM_PICTOGRAMS_ID }
    : (folders.length && activeFolder ? folders.find((folder) => folder.COD_CARPETA == activeFolder) : null)

  const loadFolders = useCallback(async () => {
    try {
      setLoadingFolders(true)
      const response = await fetchFoldersByUser(userId)
      console.log("Carpetas cargadas:", response)

      if (Array.isArray(response)) {
        setFolders(response)
        // Set the first folder as active if none is selected and it's not the system folder
        if (!activeFolder && response.length > 0 && activeFolder !== SYSTEM_PICTOGRAMS_ID) {
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
  }, [userId, activeFolder])

  // Carga los pictogramas del sistema
  useEffect(() => {
    if (activeFolder === SYSTEM_PICTOGRAMS_ID) {
      setLoadingSystemPictograms(true);
      
      // Transformar los pictogramas del sistema para que tengan el formato correcto
      const transformedPictograms = systemPictograms.map(pictogram => {
        // Extraer solo el nombre de archivo sin la ruta y sin la extensión
        const fileName = pictogram.path.split('/').pop().replace('.png', '');
        return {
          id: pictogram.id,
          label: pictogram.label,
          // Usamos getImageUrl para generar la URL correcta
          image: getImageUrl(fileName.replace('.png', '')),
          systemPictogram: true,
        };
      });
      
      setSystemPictogramsList(transformedPictograms);
      setFilteredSystemPictograms(transformedPictograms); // Inicializar los filtrados con todos
      setLoadingSystemPictograms(false);
    }
  }, [activeFolder]);

  // Manejar la búsqueda de pictogramas del sistema
  const handleSystemPictogramsSearch = (filteredResults) => {
    setFilteredSystemPictograms(filteredResults);
  }

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

  // Manejador de clic para pictogramas del sistema
  const handleSystemPictogramClick = (pictogram) => {
    console.log("Pictograma del sistema clickeado:", pictogram.label);
    speak(pictogram.label);
  };

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
              {activeFolder !== SYSTEM_PICTOGRAMS_ID && activeFolder && <span className="text-xs text-gray-500 ml-2">(ID: {activeFolder})</span>}
            </h2>
            <div className="flex items-center">
              {(loadingFolders || (activeFolder === SYSTEM_PICTOGRAMS_ID && loadingSystemPictograms)) && 
                <div className="text-sm text-gray-500 mr-4">Cargando...</div>}
            </div>
          </div>

          {/* Content Area */}
          {!activeFolder ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Selecciona una carpeta para ver sus pictogramas
            </div>
          ) : activeFolder === SYSTEM_PICTOGRAMS_ID ? (
            // Mostrar pictogramas del sistema
            <div className="p-4 h-full overflow-auto custom-scrollbar">
              {loadingSystemPictograms ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mr-2"></div>
                  <span>Cargando pictogramas del sistema...</span>
                </div>
              ) : (
                <div>
                  <PictogramSearch pictograms={systemPictogramsList} onSearch={handleSystemPictogramsSearch} />
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredSystemPictograms.map((pictogram) => (
                      <PictogramCard
                        key={pictogram.id}
                        pictogram={pictogram}
                        onClick={() => handleSystemPictogramClick(pictogram)}
                        onAddToQueue={() => addToQueue(pictogram)}
                        disableEditDelete={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Mostrar pictogramas de carpeta normal
            <PictogramGrid folderId={activeFolder} onPlayPictogram={playPictogram} onAddToQueue={addToQueue} />
          )}
        </main>
      </div>
    </div>
  )
}

export default HomePage