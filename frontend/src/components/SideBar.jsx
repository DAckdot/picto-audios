"use client"

import { useState, useEffect, useCallback } from "react"
import FolderItem from "./FolderItem"
import { fetchFoldersByUser, createFolder, fetchUsers } from "../api"
import { Link } from "react-router-dom"

function SideBar({ userId, selectedFolder, onSelectFolder, onChangeUser }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [folderStatus, setFolderStatus] = useState("")
  const [folderStatusClass, setFolderStatusClass] = useState("")

  // Constante para identificar la "carpeta" de pictogramas del sistema
  const SYSTEM_PICTOGRAMS_ID = "system"

  const filteredFolders = searchQuery.trim()
    ? folders.filter((folder) => folder.NOMBRE.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Cargando carpetas para el usuario ID:", userId)
      const response = await fetchFoldersByUser(userId)

      if (response.message) {
        // It's an error message or "No folders found"
        setError(response.message)
        setFolders([])
      } else {
        setFolders(response)
        console.log("Carpetas cargadas:", response)
      }
    } catch (err) {
      console.error("Error al cargar carpetas:", err)
      setError("Error al cargar carpetas")
      setFolders([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  const addFolder = async () => {
    const folderName = prompt("Ingresa el nombre de la nueva carpeta:")
    if (!folderName) return // If the user cancels or doesn't enter anything

    const trimmedName = folderName.trim()
    if (!trimmedName) {
      alert("El nombre de la carpeta no puede estar vacío")
      return
    }

    try {
      setIsCreatingFolder(true)
      setFolderStatus("Creando carpeta...")
      setFolderStatusClass("bg-blue-100 text-blue-700")

      console.log(`Intentando crear carpeta '${trimmedName}' para el usuario ${userId}`)

      const result = await createFolder(userId, trimmedName)
      console.log("Respuesta de creación de carpeta:", result)

      if (result.id) {
        setFolderStatus("¡Carpeta creada con éxito!")
        setFolderStatusClass("bg-green-100 text-green-700")

        // Reload folders after creating a new one
        await loadFolders()

        // Select the new folder
        onSelectFolder(result.id)

        // Clear message after 3 seconds
        setTimeout(() => {
          setFolderStatus("")
        }, 3000)
      } else {
        setFolderStatus(result.message || "Error al crear carpeta")
        setFolderStatusClass("bg-red-100 text-red-700")
        console.error("Error al crear carpeta:", result)
      }
    } catch (err) {
      console.error("Error al crear carpeta:", err)
      setFolderStatus(`Error: ${err.message}`)
      setFolderStatusClass("bg-red-100 text-red-700")
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetchUsers()
      if (Array.isArray(response)) {
        setUsers(response)
      } else {
        console.error("Error loading users:", response)
      }
    } catch (err) {
      console.error("Error loading users:", err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown)
    if (!showUserDropdown && users.length === 0) {
      loadUsers()
    }
  }

  const handleFolderUpdated = (updatedFolder) => {
    // Find the folder in the array and update its name
    setFolders((prevFolders) => {
      return prevFolders.map((folder) => {
        if (folder.COD_CARPETA == updatedFolder.id) {
          return { ...folder, NOMBRE: updatedFolder.name }
        }
        return folder
      })
    })
  }

  const handleFolderDeleted = (deletedFolderId) => {
    console.log(`Eliminando carpeta con ID ${deletedFolderId} de la lista`)

    // Check if the deleted folder was currently selected
    const wasSelected = selectedFolder == deletedFolderId

    // Remove the folder from the array
    setFolders((prevFolders) => {
      const folderIndex = prevFolders.findIndex((f) => f.COD_CARPETA == deletedFolderId)
      if (folderIndex >= 0) {
        const newFolders = [...prevFolders]
        newFolders.splice(folderIndex, 1)

        // If it was the selected folder, select another one
        if (wasSelected && newFolders.length > 0) {
          // Select the next folder, or the previous one if it was the last
          const nextIndex = folderIndex < newFolders.length ? folderIndex : folderIndex - 1
          if (nextIndex >= 0) {
            onSelectFolder(newFolders[nextIndex].COD_CARPETA)
          } else {
            // If there are no more folders, set selectedFolder to null
            onSelectFolder(null)
          }
        }

        // Show confirmation message
        setFolderStatus("Carpeta eliminada con éxito")
        setFolderStatusClass("bg-green-100 text-green-700")

        // Clear message after 3 seconds
        setTimeout(() => {
          setFolderStatus("")
        }, 3000)

        return newFolders
      }
      return prevFolders
    })
  }

  // Load folders when component mounts or userId changes
  useEffect(() => {
    loadFolders();
  }, [userId, loadFolders]);

  return (
    <aside className="bg-gray-100 w-64 border-r border-gray-200 h-full flex-shrink-0 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Usuario: {userId}</h2>
        <div className="relative">
          <button
            onClick={toggleUserDropdown}
            className="p-2 rounded-md hover:bg-gray-200 transition-colors"
            title="Cambiar usuario"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              {loadingUsers ? (
                <div className="p-3 text-sm text-gray-600">Cargando usuarios...</div>
              ) : users.length === 0 ? (
                <div className="p-3 text-sm text-gray-600">No hay usuarios disponibles</div>
              ) : (
                <div className="py-1">
                  {users.map((user) => (
                    <button
                      key={user.COD_USUARIO}
                      onClick={() => {
                        onChangeUser(user.COD_USUARIO)
                        setShowUserDropdown(false)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        user.COD_USUARIO === userId ? "bg-gray-100" : ""
                      }`}
                    >
                      {user.NOMBRE_USU}
                      {user.COD_USUARIO === userId && <span className="ml-2 text-xs text-green-600">(Actual)</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Buscar carpetas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="search-folders"
          name="search-folders"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-lime-400 focus:outline-none"
        />
      </div>

      {folderStatus && <div className={`p-2 m-2 text-sm rounded ${folderStatusClass}`}>{folderStatus}</div>}

      <div className="flex flex-col flex-grow">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Cargando carpetas...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Carpetas</h2>
            </div>
            
            {/* System Pictograms Folder Button */}
            <div className="px-4 mb-2">
              <button
                onClick={() => onSelectFolder(SYSTEM_PICTOGRAMS_ID)}
                className={`w-full flex items-center p-2 rounded-lg transition-colors ${
                  selectedFolder === SYSTEM_PICTOGRAMS_ID
                    ? "bg-lime-100 text-lime-700 border-2 border-lime-400"
                    : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-medium">Pictogramas por defecto</span>
              </button>
            </div>
            
            {/* Folders Section */}
            <div
              className="px-4 overflow-y-auto flex-grow"
              style={{
                maxHeight: "calc(3 * 4rem)", // Limit to 3 folders (each ~4rem tall)
                minHeight: "12rem", // Ensure a minimum height for responsiveness
              }}
            >
              {filteredFolders.length === 0 ? (
                <div className="text-center text-gray-500 mb-4">No se encontraron carpetas</div>
              ) : (
                <ul className="space-y-2">
                  {filteredFolders.map((folder) => (
                    <li key={folder.COD_CARPETA}>
                      <FolderItem
                        folder={{
                          id: folder.COD_CARPETA,
                          name: folder.NOMBRE,
                        }}
                        isSelected={selectedFolder == folder.COD_CARPETA}
                        onSelectFolder={onSelectFolder}
                        onFolderUpdated={handleFolderUpdated}
                        onFolderDeleted={handleFolderDeleted}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-4 mt-auto">
              <button
                onClick={addFolder}
                className="w-full px-4 py-3 bg-lime-400 text-white rounded-lg flex items-center justify-center hover:bg-lime-500 transition-colors"
                disabled={isCreatingFolder}
              >
                {isCreatingFolder ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                )}
                {isCreatingFolder ? "Creando..." : "Añadir Carpeta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default SideBar
