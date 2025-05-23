"use client"

import { useState, useEffect } from "react"
import PictogramCard from "./PictogramCard"
import { fetchPictogramsByFolder, createPictogram } from "../api"
import PictogramSearch from "./PictogramSearch";

// Removed testConnection and connectionStatus related code
function PictogramGrid({ folderId, onPlayPictogram, onAddToQueue }) {
  // Separate state variables for different types of loading
  const [pictograms, setPictograms] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPictogramLabel, setNewPictogramLabel] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  // Loading state for uploading pictograms (controls the loading modal)
  const [isLoading, setIsLoading] = useState(false)
  // Loading state for fetching pictograms from a folder (controls the spinner in the view)
  const [loadingPictograms, setLoadingPictograms] = useState(false)
  const [filteredPictograms, setFilteredPictograms] = useState([])

  const loadPictograms = async () => {
    try {
      setLoadingPictograms(true)
      setErrorMessage("")
      console.log("Cargando pictogramas para la carpeta ID:", folderId)
      const response = await fetchPictogramsByFolder(folderId)

      // Make sure we always have an array, even if the response is null or undefined
      if (!response || response.message === "No se encontraron pictogramas") {
        console.log("No hay pictogramas en esta carpeta")
        setPictograms([])
        setFilteredPictograms([])
      } else {
        console.log("Pictogramas cargados:", response)
        const pictogramsArray = Array.isArray(response) ? response : []
        setPictograms(pictogramsArray)
        setFilteredPictograms(pictogramsArray)
      }
    } catch (error) {
      console.error("Error al cargar pictogramas:", error)
      // If the error is a 404 with "No pictograms found", it's not really an error
      if (
        error.message &&
        (error.message.includes("No se encontraron pictogramas") || error.message.includes("Status: 404"))
      ) {
        console.log("No hay pictogramas en esta carpeta")
        setPictograms([])
        setFilteredPictograms([])
        // Don't show error in this case
        setErrorMessage("")
      } else {
        setErrorMessage(`No se pudieron cargar los pictogramas: ${error.message}`)
        setPictograms([])
        setFilteredPictograms([])
      }
    } finally {
      setLoadingPictograms(false)
    }
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setNewPictogramLabel("")
    setSelectedFile(null)
    setPreviewImage(null)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    setSelectedFile(file)

    // Show preview
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Mejora la compresión de imágenes (reducción significativa de tamaño)
  const compressImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement("canvas")
          // Reducir el tamaño máximo a 100px para mayor compresión
          const maxSize = 100
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width)
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height)
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          ctx.drawImage(img, 0, 0, width, height)

          // Usar 0.15 para una compresión más agresiva (85% de compresión)
          const compressedImage = canvas.toDataURL("image/jpeg", 0.15)
          console.log(`Imagen comprimida: ${width}x${height} pixels, tamaño: ${compressedImage.length} caracteres`)
          resolve(compressedImage)
        }
        img.onerror = (error) => reject(error)
      }
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

const uploadPictogram = async () => {
  if (!selectedFile || !newPictogramLabel.trim()) {
    alert("Por favor selecciona una imagen y proporciona una etiqueta.");
    return;
  }

  try {
    setErrorMessage("");
    setIsLoading(true);
    console.log("Subiendo pictograma a la carpeta ID:", folderId);

    // Comprimir la imagen antes de enviarla
    const compressedImage = await compressImageToBase64(selectedFile);
    
    // Extraer solo los datos Base64 sin los metadatos
    const base64Data = compressedImage.split(',')[1];
    
    // Enviar la imagen comprimida con ambos nombres de campo para asegurar compatibilidad
    const result = await createPictogram(
      folderId, 
      newPictogramLabel, 
      base64Data
    );
    
    console.log("Resultado de subida:", result);

    if (result.message && result.message.includes("Error")) {
      setErrorMessage(result.message);
      alert(`Error: ${result.message}`);
    } else if (result.error) {
      setErrorMessage(`Error: ${result.error}`);
      alert(`Error del servidor: ${result.error}`);
    } else {
      await loadPictograms();
      closeModal();
      // Show success message
      setSuccessMessage("Pictograma creado con éxito");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }
  } catch (error) {
    console.error("Error al subir pictograma:", error);
    setErrorMessage(`Error al subir pictograma: ${error.message}`);
    alert("Ha ocurrido un error al subir el pictograma. Por favor intenta nuevamente.");
  } finally {
    setIsLoading(false);
  }
};

// Manejadores para actualizaciones de pictogramas y búsqueda
  const handlePictogramUpdated = (updatedPictogram) => {
    // Actualizar el pictograma en la lista
    setPictograms((prevPictograms) => {
      const updated = prevPictograms.map((p) => {
        if (p.COD_PICTOGRAMA === updatedPictogram.COD_PICTOGRAMA) {
          return { ...p, ...updatedPictogram }
        }
        return p
      });
      setFilteredPictograms(updated);
      return updated;
    })

    // Mostrar mensaje de confirmación
    setSuccessMessage("Pictograma actualizado con éxito")
    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)
  }

  const handlePictogramDeleted = (deletedPictogramId) => {
    // Eliminar el pictograma de la lista
    setPictograms((prevPictograms) => {
      const filtered = prevPictograms.filter((p) => p.COD_PICTOGRAMA != deletedPictogramId);
      setFilteredPictograms(filtered);
      return filtered;
    })

    // Mostrar mensaje de confirmación
    setSuccessMessage("Pictograma eliminado con éxito")
    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)
  }

  const handlePictogramClick = (pictogram) => {
    // Solo agregamos a la cola sin reproducir sonido automáticamente
    onAddToQueue(pictogram)
    // Mostramos feedback visual de que se agregó a la cola
    setSuccessMessage(`Pictograma "${pictogram.FRASE || pictogram.label}" agregado a la cola`)
    setTimeout(() => {
      setSuccessMessage("")
    }, 1500)
  }

  const handleSearch = (results) => {
    setFilteredPictograms(results);
  };

  // Load pictograms when component mounts or folderId changes
  useEffect(() => {
    const loadPictograms = async () => {
      try {
        setLoadingPictograms(true);
        const response = await fetchPictogramsByFolder(folderId);
        setPictograms(response);
        setFilteredPictograms(response);
      } catch (error) {
        console.error("Error al cargar pictogramas:", error);
        setPictograms([]);
        setFilteredPictograms([]);
      } finally {
        setLoadingPictograms(false);
      }
    };

    if (folderId) {
      loadPictograms();
    }
  }, [folderId]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mensajes de alerta y éxito - más compactos */}
      <div className="px-2 pb-1">
        {errorMessage && (
          <div className="my-1 bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-sm">
            <strong>Error: </strong>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="my-1 bg-blue-100 border border-blue-400 text-blue-700 px-2 py-1 rounded text-sm">
            <strong>Estado: </strong>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Componente de búsqueda - solo visible cuando hay pictogramas */}
        {!loadingPictograms && pictograms.length > 0 && (
          <PictogramSearch pictograms={pictograms} onSearch={handleSearch} />
        )}
      </div>

      {/* Área de contenido principal con scroll */}
      <div className="flex-1 overflow-auto px-2">
        {/* Loading indicator for pictograms */}
        {loadingPictograms ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500 mr-2"></div>
            <span>Cargando pictogramas...</span>
          </div>
        ) : pictograms.length === 0 ? (
          <div className="flex flex-col items-center my-4">
            <div className="text-center text-gray-500 mb-2">No se encontraron pictogramas en esta carpeta (ID: {folderId})</div>

            <div
              className="flex flex-col items-center justify-center bg-gray-200 border border-dashed border-gray-400 rounded-lg p-4 cursor-pointer hover:bg-gray-300 w-48 h-48"
              onClick={openModal}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-gray-700 mt-2 font-medium text-sm">Añadir primer pictograma</span>
              <span className="text-gray-500 text-xs mt-1 text-center">Haz clic para subir un pictograma</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 my-2">
            {filteredPictograms.map((pictogram) => (
              <PictogramCard
                key={pictogram.COD_PICTOGRAMA || pictogram.id}
                pictogram={pictogram}
                onClick={() => handlePictogramClick(pictogram)}
                onPictogramUpdated={handlePictogramUpdated}
                onPictogramDeleted={handlePictogramDeleted}
              />
            ))}
            <div
              className="flex flex-col items-center justify-center bg-gray-200 border border-dashed border-gray-400 rounded-lg p-2 cursor-pointer hover:bg-gray-300"
              onClick={openModal}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-gray-500 mt-1 text-xs">Subir Pictograma</span>
            </div>
          </div>
        )}
      </div>

      {/* Modales - no se modifican ya que no afectan al layout principal */}
      {isLoading && (
        <div className="modal-overlay flex items-center justify-center fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p>Subiendo pictograma...</p>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-white p-6 rounded-lg shadow-lg w-80 max-w-md">
            <h2 className="text-lg font-bold mb-4">Subir Nuevo Pictograma</h2>
            <p className="text-sm text-gray-600 mb-4">ID de Carpeta: {folderId}</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {previewImage && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={previewImage || "/placeholder.svg"}
                    alt="Vista previa"
                    className="h-32 object-contain border border-gray-300 rounded p-1"
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta:</label>
              <input
                value={newPictogramLabel}
                onChange={(e) => setNewPictogramLabel(e.target.value)}
                type="text"
                placeholder="Introduce texto asociado con la imagen"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={uploadPictogram}
                className={`px-4 py-2 bg-lime-400 text-white rounded hover:bg-lime-500 ${
                  !selectedFile || !newPictogramLabel.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!selectedFile || !newPictogramLabel.trim()}
              >
                Subir
              </button>
              <button onClick={closeModal} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default PictogramGrid
