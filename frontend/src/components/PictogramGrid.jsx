"use client"

import { useState, useEffect } from "react"
import PictogramCard from "./PictogramCard"
import { fetchPictogramsByFolder, createPictogram, checkConnection } from "../api"

function PictogramGrid({ folderId, onPlayPictogram, onAddToQueue }) {
  // Separate state variables for different types of loading
  const [pictograms, setPictograms] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPictogramLabel, setNewPictogramLabel] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [connectionStatus, setConnectionStatus] = useState("")
  // Loading state for uploading pictograms (controls the loading modal)
  const [isLoading, setIsLoading] = useState(false)
  // Loading state for fetching pictograms from a folder (controls the spinner in the view)
  const [loadingPictograms, setLoadingPictograms] = useState(false)
  const [testFolderId, setTestFolderId] = useState(1)

  // Function to test connection with the backend
  const testConnection = async () => {
    try {
      const result = await checkConnection()
      if (result.connected) {
        setConnectionStatus(`Connected (Status: ${result.status})`)
      } else {
        setConnectionStatus(`Connection error: ${result.error || result.statusText}`)
      }

      // Clear the message after 5 seconds
      setTimeout(() => {
        setConnectionStatus("")
      }, 5000)
    } catch (error) {
      setConnectionStatus(`Error: ${error.message}`)
    }
  }

  const loadPictograms = async () => {
    try {
      setLoadingPictograms(true)
      setErrorMessage("")
      console.log("Loading pictograms for folder ID:", folderId)
      const response = await fetchPictogramsByFolder(folderId)

      // Make sure we always have an array, even if the response is null or undefined
      if (!response || response.message === "No se encontraron pictogramas") {
        console.log("No pictograms in this folder")
        setPictograms([])
      } else {
        console.log("Pictograms loaded:", response)
        setPictograms(Array.isArray(response) ? response : [])
      }
    } catch (error) {
      console.error("Error loading pictograms:", error)
      // If the error is a 404 with "No pictograms found", it's not really an error
      if (
        error.message &&
        (error.message.includes("No se encontraron pictogramas") || error.message.includes("Status: 404"))
      ) {
        console.log("No pictograms in this folder")
        setPictograms([])
        // Don't show error in this case
        setErrorMessage("")
      } else {
        setErrorMessage(`Could not load pictograms: ${error.message}`)
        setPictograms([])
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

  // Significantly improve image compression
  const compressImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement("canvas")
          // Drastically reduce the maximum size to ensure compatibility
          const maxSize = 120 // Slightly larger to maintain minimum acceptable quality
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

          // Use 80% compression (0.2 = 80% compression)
          const compressedImage = canvas.toDataURL("image/jpeg", 0.2)
          console.log(`Compressed image of ${width}x${height} pixels, size: ${compressedImage.length} characters`)
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
    alert("Please select an image and provide a label.");
    return;
  }

  try {
    setErrorMessage("");
    setIsLoading(true);
    console.log("Uploading pictogram to folder ID:", folderId);

    // Crear un FormData para enviar la imagen como archivo
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('COD_CARPETA', folderId);
    formData.append('FRASE', newPictogramLabel);

    const result = await createPictogram(folderId, newPictogramLabel, formData);
    console.log("Upload result:", result);

    if (result.message && result.message.includes("Error")) {
      setErrorMessage(result.message);
      alert(`Error: ${result.message}`);
    } else if (result.error) {
      setErrorMessage(`Error: ${result.error}`);
      alert(`Server error: ${result.error}`);
    } else {
      await loadPictograms();
      closeModal();
      // Show success message
      setConnectionStatus("Pictogram created successfully");
      setTimeout(() => {
        setConnectionStatus("");
      }, 3000);
    }
  } catch (error) {
    console.error("Error uploading pictogram:", error);
    setErrorMessage(`Error uploading pictogram: ${error.message}`);
    alert("An error occurred while uploading the pictogram. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  // Handlers for pictogram updates and deletions
  const handlePictogramUpdated = (updatedPictogram) => {
    // Find and update the pictogram in the list
    setPictograms((prevPictograms) => {
      return prevPictograms.map((p) => {
        if (p.COD_PICTOGRAMA === updatedPictogram.COD_PICTOGRAMA) {
          return { ...p, ...updatedPictogram }
        }
        return p
      })
    })

    // Show confirmation message
    setConnectionStatus("Pictogram updated successfully")
    setTimeout(() => {
      setConnectionStatus("")
    }, 3000)
  }

  const handlePictogramDeleted = (deletedPictogramId) => {
    // Remove the pictogram from the list
    setPictograms((prevPictograms) => {
      return prevPictograms.filter((p) => p.COD_PICTOGRAMA != deletedPictogramId)
    })

    // Show confirmation message
    setConnectionStatus("Pictogram deleted successfully")
    setTimeout(() => {
      setConnectionStatus("")
    }, 3000)
  }

  const handlePictogramClick = (pictogram) => {
    onPlayPictogram(pictogram)
    onAddToQueue(pictogram)
  }

  // Load pictograms when component mounts or folderId changes
  useEffect(() => {
    if (folderId) {
      console.log("PictogramGrid component mounted, folder ID:", folderId)
      loadPictograms()
    }
  }, [folderId])

  return (
    <div className="p-4 h-full overflow-auto custom-scrollbar md:overflow-scroll">
      {/* Error alert */}
      {errorMessage && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
          <button
            onClick={testConnection}
            className="ml-2 bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs"
          >
            Test connection
          </button>
        </div>
      )}

      {/* Diagnostic information */}
      {connectionStatus && (
        <div className="mb-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <strong className="font-bold">Status: </strong>
          <span className="block sm:inline">{connectionStatus}</span>
        </div>
      )}

      {/* Loading indicator for pictograms */}
      {loadingPictograms ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mr-2"></div>
          <span>Loading pictograms...</span>
        </div>
      ) : pictograms.length === 0 ? (
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center text-gray-500 mt-8 mb-4">No pictograms found in this folder (ID: {folderId})</div>

          <div
            className="flex flex-col items-center justify-center bg-gray-200 border border-dashed border-gray-400 rounded-lg p-6 cursor-pointer hover:bg-gray-300 w-64 h-64"
            onClick={openModal}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-gray-700 mt-4 font-medium">Add first pictogram</span>
            <span className="text-gray-500 text-sm mt-2 text-center">Click to upload a pictogram to this folder</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {pictograms.map((pictogram) => (
            <PictogramCard
              key={pictogram.COD_PICTOGRAMA || pictogram.id}
              pictogram={pictogram}
              onClick={() => handlePictogramClick(pictogram)}
              onPictogramUpdated={handlePictogramUpdated}
              onPictogramDeleted={handlePictogramDeleted}
            />
          ))}
          <div
            className="flex flex-col items-center justify-center bg-gray-200 border border-dashed border-gray-400 rounded-lg p-4 cursor-pointer hover:bg-gray-300"
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
            <span className="text-gray-500 mt-2">Upload Pictogram</span>
          </div>
        </div>
      )}

      {/* Loading modal for uploading pictogram */}
      {isLoading && (
        <div className="modal-overlay flex items-center justify-center fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p>Uploading pictogram...</p>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-white p-6 rounded-lg shadow-lg w-80 max-w-md">
            <h2 className="text-lg font-bold mb-4">Upload New Pictogram</h2>
            <p className="text-sm text-gray-600 mb-4">Folder ID: {folderId}</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Image:</label>
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
                    alt="Preview"
                    className="h-32 object-contain border border-gray-300 rounded p-1"
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Label:</label>
              <input
                value={newPictogramLabel}
                onChange={(e) => setNewPictogramLabel(e.target.value)}
                type="text"
                placeholder="Enter text associated with the image"
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
                Upload
              </button>
              <button onClick={closeModal} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(163, 230, 53, 0.5) #f0f0f0;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgb(163, 230, 53);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  )
}

export default PictogramGrid
