"use client"

import { useState, useEffect, useCallback } from "react"
import defaultImage from "../assets/picto_ex.png"
import { deletePictogram as apiDeletePictogram, updatePictogram } from "../api"
import imageService from "../services/imageService"

function PictogramCard({ pictogram, onClick, onPictogramUpdated, onPictogramDeleted }) {
  const [hasError, setHasError] = useState(false);
  const [status, setStatus] = useState("");
  const [statusClass, setStatusClass] = useState("");
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const [isElectronEnabled, setIsElectronEnabled] = useState(false);

  useEffect(() => {
    setIsElectronEnabled(window.electron !== undefined);
  }, []);

  const loadLocalImage = useCallback(async () => {
    if (!isElectronEnabled || !pictogram || (!pictogram.imagePath && !pictogram.RUTA_IMAGEN)) {
      return;
    }

    try {
      const imagePath = pictogram.imagePath || pictogram.RUTA_IMAGEN;
      const result = await imageService.loadImage(imagePath);

      if (result.success) {
        setLocalImageUrl(result.base64Image);
        setHasError(false);
      } else {
        console.error("Error loading local image:", result.error);
        setHasError(true);
      }
    } catch (error) {
      console.error("Failed to load local image:", error);
      setHasError(true);
    }
  }, [isElectronEnabled, pictogram]);

  useEffect(() => {
    loadLocalImage();
  }, [loadLocalImage]);

  // Variables for deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Variables for editing
  const [showEditModal, setShowEditModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingText, setEditingText] = useState("")
  const [editingImage, setEditingImage] = useState(null)
  const [editingPreviewImage, setEditingPreviewImage] = useState(null)

  const handleClick = () => {
    onClick(pictogram)
  }

  const handleImageError = () => {
    setHasError(true)
  }

  const getImageSource = (pictogram) => {
    // First check for local image loaded via Electron
    if (localImageUrl) {
      return localImageUrl;
    }

    // If there's an error loading the image or it doesn't have a valid image, use the default image
    if (hasError) {
      return defaultImage
    }

    // If it comes from the API, the image is in pictogram.PHOTO or pictogram.FOTO
    if (pictogram.PHOTO) {
      // Check if it's already a complete data URL
      if (typeof pictogram.PHOTO === "string" && pictogram.PHOTO.startsWith("data:")) {
        return pictogram.PHOTO
      }
      // If it's not a string or is empty, use the default image
      if (typeof pictogram.PHOTO !== "string" || !pictogram.PHOTO) {
        return defaultImage
      }
      // Otherwise, we assume it's a base64 string and build the URL
      return `data:image/jpeg;base64,${pictogram.PHOTO}`
    }

    // Also check the correct FOTO field if it exists
    if (pictogram.FOTO) {
      // Check if it's already a complete data URL
      if (typeof pictogram.FOTO === "string" && pictogram.FOTO.startsWith("data:")) {
        return pictogram.FOTO
      }
      // If it's not a string or is empty, use the default image
      if (typeof pictogram.FOTO !== "string" || !pictogram.FOTO) {
        return defaultImage
      }
      // Otherwise, we assume it's a base64 string and build the URL
      return `data:image/jpeg;base64,${pictogram.FOTO}`
    }

    // If it comes from local data, the image is in pictogram.image
    if (pictogram.image) {
      return pictogram.image
    }

    // If it doesn't have any, use the default image
    return defaultImage
  }

  // METHODS FOR DELETION

  const confirmDelete = (e) => {
    e.stopPropagation()
    setShowDeleteModal(true)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
  }

  const deletePictogram = async () => {
    if (!pictogram.COD_PICTOGRAMA) {
      setStatus("Cannot delete: ID not available")
      setStatusClass("bg-red-100 text-red-700")
      setShowDeleteModal(false)
      return
    }

    try {
      setIsDeleting(true)
      
      // If using Electron and we have a local image path, delete the local file first
      if (isElectronEnabled && (pictogram.imagePath || pictogram.RUTA_IMAGEN)) {
        try {
          const imagePath = pictogram.imagePath || pictogram.RUTA_IMAGEN;
          await imageService.deleteImage(imagePath);
          console.log("Local image deleted:", imagePath);
        } catch (err) {
          console.warn("Error deleting local image:", err);
          // Continue with deletion even if local file deletion fails
        }
      }
      
      const result = await apiDeletePictogram(pictogram.COD_PICTOGRAMA)

      if (result && result.message && result.message.includes("eliminado")) {
        // Success - notify parent component
        onPictogramDeleted(pictogram.COD_PICTOGRAMA)
        setStatus("Pictogram deleted")
        setStatusClass("bg-green-100 text-green-700")
      } else {
        // Error with server message
        setStatus(result && result.message ? result.message : "Error deleting")
        setStatusClass("bg-red-100 text-red-700")
      }
    } catch (error) {
      console.error("Error deleting pictogram:", error)
      setStatus(`Error: ${error.message || "Unknown error"}`)
      setStatusClass("bg-red-100 text-red-700")
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)

      // Clear the message after a few seconds
      setTimeout(() => {
        setStatus("")
      }, 3000)
    }
  }

  // METHODS FOR EDITING

  const openEditModal = (e) => {
    e.stopPropagation()
    // Make sure we always have access to the original phrase
    setEditingText(pictogram.FRASE || pictogram.label || "")
    setEditingImage(null)
    setEditingPreviewImage(null)
    setShowEditModal(true)
  }

  const cancelEdit = () => {
    setShowEditModal(false)
    setEditingText("")
    setEditingImage(null)
    setEditingPreviewImage(null)
  }

  const handleEditImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setEditingImage(file)

      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditingPreviewImage(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Open the Electron file selector if available
  const handleElectronFilePicker = async (e) => {
    e.preventDefault();
    
    try {
      if (!isElectronEnabled) {
        // Fall back to regular file input if Electron is not available
        document.getElementById('edit-file-input').click();
        return;
      }
      
      const result = await imageService.selectImage();
      if (result.success) {
        setEditingImage({
          name: result.fileName,
          type: 'image/jpeg', // Assume JPEG for simplicity
          electronFile: true,
          base64Data: result.base64Image
        });
        setEditingPreviewImage(result.base64Image);
      }
    } catch (error) {
      console.error("Error selecting file with Electron:", error);
      // Fall back to regular file input
      document.getElementById('edit-file-input').click();
    }
  };

  // Function to compress image before uploading
  const compressImageToBase64 = (file) => {
    // For Electron files, we already have the base64 in the file object
    if (file.electronFile) {
      return Promise.resolve(file.base64Data);
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const maxSize = 120 // Maximum size for compatibility
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

          // 80% compression
          const compressedImage = canvas.toDataURL("image/jpeg", 0.2)
          resolve(compressedImage)
        }
        img.onerror = (error) => reject(error)
      }
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  const saveEdit = async () => {
    if (!pictogram.COD_PICTOGRAMA) {
      setStatus("Cannot edit: ID not available")
      setStatusClass("bg-red-100 text-red-700")
      setShowEditModal(false)
      return
    }

    try {
      setIsEditing(true)

      // Prepare data for update
      const updateData = {}

      // ALWAYS include the current phrase or the edited phrase
      updateData.FRASE = editingText.trim() || pictogram.FRASE || pictogram.label || ""

      // If a new image was selected
      if (editingImage) {
        // Handle image through Electron if available
        if (isElectronEnabled) {
          const base64Data = editingImage.electronFile 
            ? editingImage.base64Data
            : await compressImageToBase64(editingImage);
            
          // Save the image locally and get the path
          const saveResult = await imageService.saveImage(
            base64Data,
            updateData.FRASE,
            `folder_${pictogram.COD_CARPETA || 'default'}`
          );
          
          if (!saveResult.success) {
            throw new Error(`Failed to save image locally: ${saveResult.error}`);
          }
          
          updateData.imagePath = saveResult.filePath;
          updateData.RUTA_IMAGEN = saveResult.filePath;
          updateData.isLocalPath = true;
          
          // Delete old image if it exists
          if (pictogram.imagePath || pictogram.RUTA_IMAGEN) {
            try {
              await imageService.deleteImage(pictogram.imagePath || pictogram.RUTA_IMAGEN);
            } catch (err) {
              console.warn("Error deleting old image:", err);
            }
          }
        } else {
          // For web mode, use base64
          updateData.PHOTO = await compressImageToBase64(editingImage);
        }
      }

      // Check if there's data to update
      if (updateData.FRASE === (pictogram.FRASE || pictogram.label || "") && !editingImage) {
        setStatus("No changes to save")
        setStatusClass("bg-yellow-100 text-yellow-700")
        setShowEditModal(false)
        setIsEditing(false)
        return
      }

      console.log("Sending update with data:", {
        id: pictogram.COD_PICTOGRAMA,
        FRASE: updateData.FRASE,
        hasImage: editingImage ? "Yes" : "No",
        isLocalPath: updateData.isLocalPath ? "Yes" : "No"
      })

      // Perform the update
      const result = await updatePictogram(pictogram.COD_PICTOGRAMA, updateData)

      if (result.success) {
        // Successful update
        setStatus("Pictogram updated")
        setStatusClass("bg-green-100 text-green-700")

        // Notify the parent component about the update
        const updatedPictogram = {
          ...pictogram,
          FRASE: updateData.FRASE,
        }
        
        // Update image-related fields based on storage method
        if (updateData.isLocalPath) {
          // For Electron, update path fields
          updatedPictogram.imagePath = updateData.imagePath;
          updatedPictogram.RUTA_IMAGEN = updateData.RUTA_IMAGEN;
          // Update local display immediately
          if (editingImage && editingImage.base64Data) {
            setLocalImageUrl(editingImage.base64Data);
          }
        } else if (updateData.PHOTO) {
          // For web, update base64 data
          updatedPictogram.PHOTO = updateData.PHOTO;
        }

        onPictogramUpdated(updatedPictogram)
      } else {
        // Error with server message
        setStatus(result.message || "Error updating")
        setStatusClass("bg-red-100 text-red-700")
      }
    } catch (error) {
      console.error("Error updating pictogram:", error)
      setStatus(`Error: ${error.message || "Unknown error"}`)
      setStatusClass("bg-red-100 text-red-700")
    } finally {
      setIsEditing(false)
      setShowEditModal(false)

      // Clear the message after a few seconds
      setTimeout(() => {
        setStatus("")
      }, 3000)
    }
  }

  return (
    <div className="pictogram-card-container relative">
      <div
        className="pictogram-card flex flex-col items-center bg-white rounded-lg border border-lime-500 overflow-hidden hover:shadow-lg transition-shadow duration-200 w-full max-w-[200px] mx-auto aspect-square cursor-pointer"
        onClick={handleClick}
      >
        <img
          src={getImageSource(pictogram) || "/placeholder.svg"}
          alt={pictogram.FRASE || pictogram.label || "Pictogram"}
          className="object-contain h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
          onError={handleImageError}
        />
        <p className="text-sm sm:text-base md:text-sm font-medium text-lime-700 mt-2 text-center leading-tight">
          {pictogram.FRASE || pictogram.label}
        </p>

        {/* Floating action buttons */}
        <div className="absolute top-1 right-1 flex space-x-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={openEditModal}
            className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md"
            title="Edit pictogram"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={confirmDelete}
            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
            title="Delete pictogram"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
        
        {/* Local storage indicator */}
        {isElectronEnabled && (pictogram.imagePath || pictogram.RUTA_IMAGEN) && (
          <span className="absolute top-1 left-1 bg-green-100 text-green-800 text-[8px] px-1 rounded">
            Local
          </span>
        )}
      </div>

      {/* Status indicator for operations */}
      {status && <div className={`text-xs p-1 mt-1 rounded text-center ${statusClass}`}>{status}</div>}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelDelete}
        >
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the pictogram "
              <span className="font-semibold">{pictogram.FRASE || pictogram.label}</span>"?
              <br />
              <br />
              <span className="text-red-600 text-sm">This action cannot be undone.</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deletePictogram}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelEdit}
        >
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Pictogram</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Text:</label>
              <input
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter new text"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Image:</label>
              <div className="flex flex-col items-center">
                <img
                  src={editingPreviewImage || getImageSource(pictogram)}
                  alt="Preview"
                  className="h-28 w-28 object-contain border border-gray-300 rounded mb-3"
                />
                <div className="flex items-center">
                  <input
                    id="edit-file-input"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                  />
                  <button 
                    className="cursor-pointer px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={handleElectronFilePicker}
                  >
                    {isElectronEnabled ? "Select Image" : "Upload Image"}
                  </button>
                </div>
                
                {isElectronEnabled && (pictogram.imagePath || pictogram.RUTA_IMAGEN) && (
                  <p className="text-xs text-green-600 mt-2">
                    Current image is stored locally
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-lime-500 text-white rounded hover:bg-lime-600 transition-colors"
                disabled={isEditing || (!editingText && !editingImage)}
              >
                {isEditing ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default PictogramCard
