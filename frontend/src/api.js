const API_BASE_URL = "https://pb-ykap.onrender.com/index.php";

// Función auxiliar para manejar errores y depuración
async function fetchWithErrorHandling(url, options = {}) {
    console.log(`Realizando petición a: ${url}`);
    try {
        const response = await fetch(url, options);
        
        // Log de la respuesta completa para debuggear
        console.log(`Status code: ${response.status}`);
        console.log(`Response headers:`, Object.fromEntries([...response.headers]));
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            console.log(`Respuesta de ${url}:`, data);
            return data;
        } else {
            const text = await response.text();
            console.log(`Respuesta texto de ${url}:`, text);
            return { message: text };
        }
    } catch (error) {
        console.error(`Error en petición a ${url}:`, error);
        throw error;
    }
}

// Función para verificar la conexión con el servidor
export async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            // 3 segundos de timeout para probar la conexión
            signal: AbortSignal.timeout(3000)
        });
        
        return {
            connected: response.ok,
            status: response.status,
            statusText: response.statusText
        };
    } catch (error) {
        console.error("Error de conexión:", error);
        return {
            connected: false,
            error: error.toString()
        };
    }
}

export async function fetchUsers() {
    return fetchWithErrorHandling(`${API_BASE_URL}/usuarios`);
}

export async function fetchFoldersByUser(userId) {
    return fetchWithErrorHandling(`${API_BASE_URL}/carpetas?usuario_id=${userId}`);
}

export async function fetchPictogramsByFolder(folderId) {
    return fetchWithErrorHandling(`${API_BASE_URL}/pictogramas?carpeta_id=${folderId}`);
}

export async function createFolder(userId, name) {
    return fetchWithErrorHandling(`${API_BASE_URL}/carpetas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ COD_USUARIO: userId, NOMBRE: name }),
    });
}

export async function deleteFolder(folderId) {
    return fetchWithErrorHandling(`${API_BASE_URL}/carpetas/${folderId}`, {
        method: "DELETE",
    });
}

export async function createPictogram(folderId, phrase, photo) {
    const data = {
        COD_CARPETA: folderId,
        FRASE: phrase,
        PHOTO: photo
    };

    console.log("Creando pictograma con datos:", {
        COD_CARPETA: folderId,
        FRASE: phrase,
        PHOTO: photo ? `Base64 image (length: ${photo.length})` : "No image"
    });

    try {
        // Primero verificamos que la imagen no sea demasiado grande
        if (photo && photo.length > 1500000) {
            console.warn("La imagen es muy grande, puede causar problemas");
        }

        const result = await fetchWithErrorHandling(`${API_BASE_URL}/pictogramas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        
        return result;
    } catch (error) {
        console.error("Error al crear pictograma:", error);
        throw error;
    }
}

export async function deletePictogram(pictogramId) {
    return fetchWithErrorHandling(`${API_BASE_URL}/pictogramas/${pictogramId}`, {
        method: "DELETE",
    });
}