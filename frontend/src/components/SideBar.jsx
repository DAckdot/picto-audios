"use client"

import { useState, useEffect } from "react"
import FolderItem from "./FolderItem"
import { fetchFoldersByUser, createFolder, fetchUsers } from "../api"

function SideBar({ userId, selectedFolder, onSelectFolder, onChangeUser, onShowDefaultPictograms, isElectronEnabled }) {
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

  const filteredFolders = searchQuery.trim()
    ? folders.filter((folder) => folder.NOMBRE.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders

  const loadFolders = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Loading folders for user ID:", userId)
      const response = await fetchFoldersByUser(userId)

      if (response.message) {
        // It's an error message or "No folders found"
        setError(response.message)
        setFolders([])
      } else {
        setFolders(response)
        console.log("Folders loaded:", response)
      }
    } catch (err) {
      console.error("Error loading folders:", err)
      setError("Error loading folders")
      setFolders([])
    } finally {
      setLoading(false)
    }
  }

  const addFolder = async () => {
    const folderName = prompt("Enter the name of the new folder:")
    if (!folderName) return // If the user cancels or doesn't enter anything

    const trimmedName = folderName.trim()
    if (!trimmedName) {
      alert("Folder name cannot be empty")
      return
    }

    try {
      setIsCreatingFolder(true)
      setFolderStatus("Creating folder...")
      setFolderStatusClass("bg-blue-100 text-blue-700")

      console.log(`Trying to create folder '${trimmedName}' for user ${userId}`)

      const result = await createFolder(userId, trimmedName)
      console.log("Create folder response:", result)

      if (result.id) {
        setFolderStatus("Folder created successfully!")
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
        setFolderStatus(result.message || "Error creating folder")
        setFolderStatusClass("bg-red-100 text-red-700")
        console.error("Error creating folder:", result)
      }
    } catch (err) {
      console.error("Error creating folder:", err)
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
    console.log(`Removing folder with ID ${deletedFolderId} from the list`)

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
        setFolderStatus("Folder deleted successfully")
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

  const handleFolderSelection = (folderId) => {
    console.log("Folder selected in SideBar:", folderId);
    setTimeout(() => onSelectFolder(folderId), 0); // Defer the state update to avoid React warning
  };

  // Load folders when component mounts or userId changes
  useEffect(() => {
    loadFolders()
  }, [userId])

  return (
    <aside className="bg-gray-100 w-64 border-r border-gray-200 h-full flex-shrink-0">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">User: {userId}</h2>
        <div className="relative">
          <button
            onClick={toggleUserDropdown}
            className="p-2 rounded-md hover:bg-gray-200 transition-colors"
            title="Change user"
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
                <div className="p-3 text-sm text-gray-600">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="p-3 text-sm text-gray-600">No users available</div>
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
                      {user.COD_USUARIO === userId && <span className="ml-2 text-xs text-green-600">(Current)</span>}
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
          placeholder="Search folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="search-folders"
          name="search-folders"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-lime-400 focus:outline-none"
        />
      </div>

      {folderStatus && <div className={`p-2 m-2 text-sm rounded ${folderStatusClass}`}>{folderStatus}</div>}

      {/* Default Pictograms Button (only in Electron mode) */}
      {isElectronEnabled && (
        <div className="px-4 py-3 border-b border-gray-200">
          <button
            onClick={onShowDefaultPictograms}
            className="w-full px-3 py-2 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
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
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Default Pictograms
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-4 text-center text-gray-500">Loading folders...</div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : (
        <nav className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Folders</h2>

          {filteredFolders.length === 0 ? (
            <div className="text-center text-gray-500 mb-4">No folders found</div>
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
                    onSelectFolder={handleFolderSelection} // Use the new handler
                    onFolderUpdated={handleFolderUpdated}
                    onFolderDeleted={handleFolderDeleted}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
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
              {isCreatingFolder ? "Creating..." : "Add Folder"}
            </button>
          </div>

          {/* Electron Mode Indicator */}
          {isElectronEnabled && (
            <div className="mt-6 p-3 bg-green-50 text-green-700 text-xs rounded-lg">
              <span className="font-semibold">Desktop Mode</span>
              <p className="mt-1">Images are stored locally on your computer</p>
            </div>
          )}
        </nav>
      )}
    </aside>
  )
}

export default SideBar
