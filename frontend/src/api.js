const API_BASE_URL = "https://pb-ykap.onrender.com/index.php"
// Retry parameters for critical operations
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000 // ms between retries

// Function to wait a specific time
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Clean responses that contain unwanted data
const cleanResponse = (responseText) => {
  // Find the start of valid JSON
  const jsonStartIndex = responseText.indexOf("[") >= 0 ? responseText.indexOf("[") : responseText.indexOf("{")
  if (jsonStartIndex !== -1) {
    return responseText.slice(jsonStartIndex).trim() // Return only valid JSON
  }
  return responseText // If no JSON is found, return the original text
}

// Helper function to handle errors and debugging with retries
async function fetchWithRetriesAndErrorHandling(url, options = {}, attempts = RETRY_ATTEMPTS) {
  console.log(`Making request to: ${url} (Attempts remaining: ${attempts})`)
  try {
    // Set timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds

    if (!options.signal) {
      options.signal = controller.signal
    }

    // Include credentials to handle potential CORS issues
    if (!options.credentials) {
      options.credentials = "same-origin"
    }

    // Ensure headers are properly configured
    if (!options.headers) {
      options.headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      }
    }

    const response = await fetch(url, options)
    clearTimeout(timeoutId)

    // Log the response
    console.log(`Status code: ${response.status}`)
    console.log(`Response headers:`, Object.fromEntries([...response.headers]))

    // Capture full response text
    const responseText = await response.text()
    console.log(`Response text from ${url}:`, responseText)

    // Clean the response if it contains unwanted data
    const cleanedResponseText = cleanResponse(responseText)

    // Handle special case: 404 with message "No pictograms found" - this is valid
    if (response.status === 404 && cleanedResponseText.includes("No se encontraron pictogramas")) {
      return [] // Return empty array instead of error
    }

    // If not a successful response for other cases
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}, Response: ${cleanedResponseText}`)
    }

    // Try to parse as JSON if it has content
    if (cleanedResponseText.trim()) {
      try {
        const data = JSON.parse(cleanedResponseText)
        console.log(`Parsed JSON response from ${url}:`, data)
        return data
      } catch (jsonError) {
        console.warn(`Response is not valid JSON after cleaning:`, jsonError)
        return { message: cleanedResponseText }
      }
    } else {
      return { message: "Empty response from server" }
    }
  } catch (error) {
    console.error(`Error in request to ${url}:`, error)

    // Classify the error
    const errorType =
      error.name === "AbortError"
        ? "timeout"
        : error.message.includes("NetworkError")
          ? "network"
          : error.message.includes("CORS")
            ? "cors"
            : "other"

    console.log(`Error type: ${errorType}`)

    // Retry if there are still attempts available for certain error types
    if (attempts > 1 && ["timeout", "network"].includes(errorType)) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`)
      await wait(RETRY_DELAY)
      return fetchWithRetriesAndErrorHandling(url, options, attempts - 1)
    }

    // Specific message based on error type
    if (errorType === "timeout") {
      throw new Error("The request took too long to complete. The server might be busy.")
    } else if (errorType === "network") {
      throw new Error(
        "Network error: Could not connect to the server. Check your internet connection or server status.",
      )
    } else if (errorType === "cors") {
      throw new Error("CORS error: The server does not allow requests from this origin.")
    }

    throw error
  }
}

// Function to check connection with the server
export async function checkConnection() {
  try {
    // Use the retry system for this test too
    await fetchWithRetriesAndErrorHandling(
      `${API_BASE_URL}/usuarios`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        // Only one attempt for the connection test
      },
      1,
    )

    return {
      connected: true,
      status: 200,
      statusText: "OK",
    }
  } catch (error) {
    console.error("Connection error:", error)
    return {
      connected: false,
      error: error.toString(),
    }
  }
}

// Advanced connectivity check
export async function checkServerStatus() {
  try {
    console.log("Checking detailed server status...")

    // Check CORS and general status
    const corsTest = await fetch(`${API_BASE_URL}/usuarios`, {
      method: "GET",
      mode: "cors",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    })
      .then((r) => ({
        ok: r.ok,
        status: r.status,
        statusText: r.statusText,
        cors: "supported",
      }))
      .catch((e) => ({
        ok: false,
        error: e.toString(),
        cors: e.toString().includes("CORS") ? "CORS error" : "unknown",
      }))

    // Check latency
    const startTime = Date.now()
    const latencyTest = await fetch(`${API_BASE_URL}/usuarios`, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })
      .then((r) => ({
        latency: Date.now() - startTime,
        ok: r.ok,
      }))
      .catch((e) => ({
        latency: -1,
        error: e.toString(),
      }))

    // Check if the server is in hibernation mode (common in free plans)
    const hibernationTest = latencyTest.latency > 3000 && latencyTest.ok

    return {
      available: corsTest.ok,
      status: corsTest.status,
      cors: corsTest.cors,
      latency: latencyTest.latency,
      possibleHibernation: hibernationTest,
      message: hibernationTest
        ? "The server appears to be waking up from hibernation, subsequent attempts should work."
        : latencyTest.latency > 1000 && latencyTest.ok
          ? "The server is responding, but with high latency. Some operations might fail due to timeout."
          : corsTest.ok
            ? "The server is responding normally."
            : "The server is not responding correctly.",
    }
  } catch (error) {
    return {
      available: false,
      error: error.toString(),
      message: "Error checking server status: " + error.message,
    }
  }
}

export async function fetchUsers() {
  return fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/usuarios`)
}

export async function fetchFoldersByUser(userId) {
  return fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/carpetas?usuario_id=${userId}`)
}

export async function fetchPictogramsByFolder(folderId) {
  try {
    // Usamos una solicitud directa para obtener todos los pictogramas
    const response = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/pictogramas`)

    // Si no hay pictogramas, devolvemos array vacío
    if (!response || !Array.isArray(response) || response.length === 0) {
      console.log("No hay pictogramas disponibles")
      return []
    }

    // Filtramos los pictogramas que pertenecen a la carpeta solicitada
    const pictogramsInFolder = response.filter(pictogram => 
      pictogram.COD_CARPETA == folderId
    )

    if (pictogramsInFolder.length === 0) {
      console.log(`No hay pictogramas en la carpeta ID: ${folderId}`)
      return []
    }

    // Cargamos los datos completos para cada pictograma en una sola operación
    console.log(`Cargando ${pictogramsInFolder.length} pictogramas completos para carpeta ${folderId}`)
    
    const completePictograms = await Promise.all(
      pictogramsInFolder.map(async (pictogram) => {
        try {
          // Obtenemos directamente la información completa
          const fullPictogram = await fetchWithRetriesAndErrorHandling(
            `${API_BASE_URL}/pictogramas/${pictogram.COD_PICTOGRAMA}`
          )
          
          // Si obtuvimos respuesta válida, la usamos
          if (fullPictogram) {
            return {
              ...pictogram,
              PHOTO: fullPictogram.PHOTO || null,
              FOTO: fullPictogram.PHOTO || null // Para compatibilidad
            }
          }
          return pictogram
        } catch (error) {
          console.warn(`No se pudo cargar datos completos para pictograma ${pictogram.COD_PICTOGRAMA}`)
          return pictogram
        }
      })
    )
    
    console.log(`Pictogramas completos cargados para carpeta ${folderId}`)
    return completePictograms
    
  } catch (error) {
    console.error("Error al cargar pictogramas:", error)
    return []
  }
}

export async function createFolder(userId, name) {
  console.log(`Trying to create folder: name="${name}" for user=${userId}`)

  // Verify input data
  if (!userId || !name) {
    console.error("Incomplete data for creating folder", { userId, name })
    return { message: "Incomplete data: user ID and folder name required" }
  }

  try {
    // Make sure the data is of the correct type
    const data = {
      COD_USUARIO: Number.parseInt(userId, 10),
      NOMBRE: String(name).trim(),
    }

    console.log("Sending request to create folder with data:", data)

    const result = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/carpetas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })

    console.log("Folder creation response:", result)
    return result
  } catch (error) {
    console.error("Error creating folder:", error)
    return {
      message: `Error creating folder: ${error.message}`,
      error: error.toString(),
    }
  }
}

export async function deleteFolder(folderId) {
  return fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/carpetas/${folderId}`, {
    method: "DELETE",
  })
}

export async function createPictogram(folderId, phrase, photo) {
  const data = {
    COD_CARPETA: folderId,
    FRASE: phrase,
    PHOTO: photo, // Mantenemos "PHOTO" para compatibilidad con el backend
  }

  console.log("Creating pictogram with data:", {
    COD_CARPETA: folderId,
    FRASE: phrase,
    PHOTO: photo ? `Base64 image (length: ${photo.length})` : "No image",
  })

  try {
    // First check if the image is too large
    if (photo && photo.length > 1000000) {
      console.warn("The image is very large, it may cause problems with the database")
    }

    const result = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/pictogramas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    return result
  } catch (error) {
    console.error("Error creating pictogram:", error)
    throw error
  }
}

export async function deletePictogram(pictogramId) {
  return fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/pictogramas/${pictogramId}`, {
    method: "DELETE",
  })
}

export async function updateFolder(folderId, newName) {
  console.log(`Trying to update folder ID=${folderId} with new name="${newName}"`)

  // Verify input data
  if (!folderId || !newName) {
    console.error("Incomplete data for updating folder", { folderId, newName })
    return { message: "Incomplete data: folder ID and new name required" }
  }

  try {
    // Make sure the data is of the correct type
    const data = {
      NOMBRE: String(newName).trim(),
    }

    if (data.NOMBRE.length === 0) {
      return { message: "Folder name cannot be empty" }
    }

    console.log("Sending request to update folder with data:", data)

    const result = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/carpetas/${folderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })

    console.log("Folder update response:", result)

    if (result && result.message && result.message.includes("actualizada")) {
      return { success: true, message: result.message, id: folderId }
    } else {
      return result
    }
  } catch (error) {
    console.error("Error updating folder:", error)
    return {
      success: false,
      message: `Error updating folder: ${error.message}`,
      error: error.toString(),
    }
  }
}

export async function updatePictogram(pictogramId, updateData) {
  console.log(`Updating pictogram with ID=${pictogramId}`, updateData)

  // Verify input data
  if (!pictogramId) {
    console.error("Pictogram ID not provided")
    return { success: false, message: "Pictogram ID required" }
  }

  // Validate that there is data to update and ensure FRASE is always included
  if (!updateData.FRASE && !updateData.PHOTO) {
    console.error("No data provided for update")
    return { success: false, message: "At least phrase or image required for update" }
  }

  try {
    // Prepare the data for sending
    const data = {}

    // ALWAYS include the phrase, even if only updating the image
    if (updateData.FRASE !== undefined) {
      data.FRASE = updateData.FRASE
    }

    // Give preference to PHOTO for compatibility
    if (updateData.PHOTO) {
      data.PHOTO = updateData.PHOTO
    }

    console.log("Sending request to update pictogram with data:", {
      FRASE: data.FRASE,
      "Image size": data.PHOTO ? `${data.PHOTO.length} characters` : "No changes",
    })

    const result = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/pictogramas/${pictogramId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })

    console.log("Pictogram update response:", result)

    if (result && result.message && result.message.includes("actualizado")) {
      return { success: true, message: result.message, id: pictogramId }
    } else {
      return { success: false, message: result.message || "Unknown error during update" }
    }
  } catch (error) {
    console.error("Error updating pictogram:", error)
    return {
      success: false,
      message: `Error updating pictogram: ${error.message}`,
      error: error.toString(),
    }
  }
}
