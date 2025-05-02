"use client"

import { useState, useRef, useEffect } from "react"
import { updateFolder, deleteFolder } from "../api"

function FolderItem({ folder, isSelected, onSelectFolder, onFolderUpdated, onFolderDeleted }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState("")
  const nameInputRef = useRef(null)
  const [status, setStatus] = useState("")
  const [statusClass, setStatusClass] = useState("")

  // Variables for deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const selectFolder = () => {
    // Only select the folder if we're not in edit mode
    if (!isEditing) {
      onSelectFolder(folder.id)
    }
  }

  const startEdit = (e) => {
    e.stopPropagation()
    setEditingName(folder.name)
    setIsEditing(true)
  }

  const cancelEdit = (e) => {
    if (e) e.stopPropagation()
    setIsEditing(false)
    setStatus("")
  }

  const saveEdit = async (e) => {
    if (e) e.stopPropagation()

    // Validate that the name is not empty
    if (!editingName.trim()) {
      setStatus("El nombre no puede estar vacío")
      setStatusClass("bg-red-100 text-red-700")
      return
    }

    // If the name didn't change, just close edit mode
    if (editingName === folder.name) {
      setIsEditing(false)
      return
    }

    try {
      setStatus("Guardando...")
      setStatusClass("bg-blue-100 text-blue-700")

      const result = await updateFolder(folder.id, editingName)

      if (result.success) {
        setStatus("¡Carpeta actualizada!")
        setStatusClass("bg-green-100 text-green-700")

        // Emit event to update the folder list
        onFolderUpdated({
          id: folder.id,
          name: editingName,
        })

        // Close edit mode after 1.5 seconds
        setTimeout(() => {
          setIsEditing(false)
          setStatus("")
        }, 1500)
      } else {
        setStatus(result.message || "Error al actualizar")
        setStatusClass("bg-red-100 text-red-700")
      }
    } catch (error) {
      console.error("Error al actualizar carpeta:", error)
      setStatus(`Error: ${error.message}`)
      setStatusClass("bg-red-100 text-red-700")
    }
  }

  // Functions for handling folder deletion
  const showDeleteConfirmation = (e) => {
    e.stopPropagation()
    setShowDeleteModal(true)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
  }

  const confirmDelete = async () => {
    try {
      setIsDeleting(true)

      console.log(`Eliminando carpeta con ID: ${folder.id}`)
      const result = await deleteFolder(folder.id)

      if (result && result.message && result.message.includes("eliminada")) {
        // The folder was successfully deleted
        onFolderDeleted(folder.id)
        setShowDeleteModal(false)

        // Show success message momentarily
        setStatus("Carpeta eliminada con éxito")
        setStatusClass("bg-green-100 text-green-700")
        setTimeout(() => {
          setStatus("")
        }, 2000)
      } else if (result && result.message) {
        // Specific error from the server
        setStatus(result.message)
        setStatusClass("bg-red-100 text-red-700")
        setShowDeleteModal(false)
      } else {
        throw new Error("Respuesta inesperada del servidor")
      }
    } catch (error) {
      console.error("Error al eliminar carpeta:", error)
      setStatus(`Error: ${error.message}`)
      setStatusClass("bg-red-100 text-red-700")
      setShowDeleteModal(false)
    } finally {
      setIsDeleting(false)
    }
  }

  // Focus the input field when entering edit mode
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [isEditing])

  return (
    <div className="folder-item-container relative">
      <div
        className={`folder-item flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          isSelected ? "bg-lime-400 text-white" : "hover:bg-gray-200"
        }`}
        onClick={selectFolder}
      >
        <div className="flex items-center flex-grow">
          <div className="icon w-8 h-8 flex items-center justify-center bg-gray-300 rounded-md mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 7h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a 2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
              <path d="M3 7l3-3h12l3 3" />
            </svg>
          </div>

          {/* Edit mode */}
          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="border border-gray-300 rounded py-1 px-2 text-gray-700 flex-grow"
              ref={nameInputRef}
              onKeyUp={(e) => {
                if (e.key === "Enter") saveEdit(e)
                if (e.key === "Escape") cancelEdit(e)
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="folder-name font-bold text-xs">{folder.name}</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="actions flex items-center ml-2" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <>
              <button onClick={saveEdit} className="p-1 text-blue-500 hover:text-blue-700" title="Guardar">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>

              <button onClick={cancelEdit} className="p-1 text-red-500 hover:text-red-700" title="Cancelar">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button onClick={startEdit} className="p-1 text-gray-500 hover:text-gray-700" title="Editar nombre">
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>

              <button
                onClick={showDeleteConfirmation}
                className="p-1 ml-1 text-red-500 hover:text-red-700"
                title="Eliminar carpeta"
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
            </>
          )}
        </div>
      </div>

      {/* Status messages */}
      {status && <div className={`text-xs p-1 mt-1 rounded text-center ${statusClass}`}>{status}</div>}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelDelete}
        >
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar la carpeta "<span className="font-semibold">{folder.name}</span>"?
              <br />
              <br />
              <span className="text-red-600 text-sm">
                Esta acción no se puede deshacer y eliminará todo el contenido de la carpeta.
              </span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FolderItem
