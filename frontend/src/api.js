const API_BASE_URL = "https://pb-ykap.onrender.com/index.php";
// Parámetros de reintento para operaciones críticas
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // ms entre reintentos

// Función para esperar un tiempo específico
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Limpiar respuestas que contienen datos no deseados
const cleanResponse = (responseText) => {
    // Buscar el inicio del JSON válido
    const jsonStartIndex = responseText.indexOf('[') >= 0 ? responseText.indexOf('[') : responseText.indexOf('{');
    if (jsonStartIndex !== -1) {
        return responseText.slice(jsonStartIndex).trim(); // Retornar solo el JSON válido
    }
    return responseText; // Si no se encuentra JSON, retornar el texto original
};

// Función auxiliar para manejar errores y depuración con reintentos
async function fetchWithRetriesAndErrorHandling(url, options = {}, attempts = RETRY_ATTEMPTS) {
    console.log(`Realizando petición a: ${url} (Intentos restantes: ${attempts})`);
    try {
        // Configurar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
        
        if (!options.signal) {
            options.signal = controller.signal;
        }
        
        // Incluir credenciales para manejar posibles problemas de CORS
        if (!options.credentials) {
            options.credentials = 'same-origin';
        }
        
        // Asegurar que los headers estén configurados correctamente
        if (!options.headers) {
            options.headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
        }
        
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        
        // Log de la respuesta
        console.log(`Status code: ${response.status}`);
        console.log(`Response headers:`, Object.fromEntries([...response.headers]));
        
        // Capturar texto completo de la respuesta
        const responseText = await response.text();
        console.log(`Respuesta texto de ${url}:`, responseText);

        // Limpiar la respuesta si contiene datos no deseados
        const cleanedResponseText = cleanResponse(responseText);

        // Manejar caso especial: 404 con mensaje "No se encontraron pictogramas" - esto es válido
        if (response.status === 404 && cleanedResponseText.includes("No se encontraron pictogramas")) {
            return []; // Devolver array vacío en lugar de error
        }
        
        // Si no es una respuesta exitosa para otros casos
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}, Response: ${cleanedResponseText}`);
        }
        
        // Intentar parsear como JSON si tiene contenido
        if (cleanedResponseText.trim()) {
            try {
                const data = JSON.parse(cleanedResponseText);
                console.log(`Respuesta JSON parseada de ${url}:`, data);
                return data;
            } catch (jsonError) {
                console.warn(`La respuesta no es JSON válido después de limpiar:`, jsonError);
                return { message: cleanedResponseText };
            }
        } else {
            return { message: "Respuesta vacía del servidor" };
        }
    } catch (error) {
        console.error(`Error en petición a ${url}:`, error);
        
        // Clasificar el error
        const errorType = 
            error.name === 'AbortError' ? 'timeout' :
            error.message.includes('NetworkError') ? 'network' :
            error.message.includes('CORS') ? 'cors' : 'other';
            
        console.log(`Tipo de error: ${errorType}`);
        
        // Reintentar si aún hay intentos disponibles para ciertos tipos de errores
        if (attempts > 1 && ['timeout', 'network'].includes(errorType)) {
            console.log(`Reintentando en ${RETRY_DELAY}ms...`);
            await wait(RETRY_DELAY);
            return fetchWithRetriesAndErrorHandling(url, options, attempts - 1);
        }
        
        // Mensaje específico según el tipo de error
        if (errorType === 'timeout') {
            throw new Error('La solicitud tardó demasiado tiempo en completarse. El servidor podría estar ocupado.');
        } else if (errorType === 'network') {
            throw new Error('Error de red: No se pudo conectar al servidor. Verifique su conexión a internet o el estado del servidor.');
        } else if (errorType === 'cors') {
            throw new Error('Error CORS: El servidor no permite solicitudes desde este origen.');
        }
        
        throw error;
    }
}

// Función para verificar la conexión con el servidor
export async function checkConnection() {
    try {
        // Usar el sistema de reintentos para esta prueba también
        const result = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/usuarios`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            // Solo un intento para la prueba de conexión
        }, 1);
        
        return {
            connected: true,
            status: 200,
            statusText: "OK"
        };
    } catch (error) {
        console.error("Error de conexión:", error);
        return {
            connected: false,
            error: error.toString()
        };
    }
}

// Verificación avanzada de conectividad
export async function checkServerStatus() {
  try {
    console.log("Verificando estado detallado del servidor...");
    
    // Verificar CORS y estado general
    const corsTest = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'GET',
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    }).then(r => ({
      ok: r.ok,
      status: r.status,
      statusText: r.statusText,
      cors: 'soportado'
    })).catch(e => ({
      ok: false,
      error: e.toString(),
      cors: e.toString().includes('CORS') ? 'error CORS' : 'desconocido'
    }));
    
    // Verificar latencia
    const startTime = Date.now();
    const latencyTest = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    }).then(r => ({
      latency: Date.now() - startTime,
      ok: r.ok
    })).catch(e => ({
      latency: -1,
      error: e.toString()
    }));
    
    // Verificar si el servidor está en modo de hibernación (común en planes gratuitos)
    const hibernationTest = latencyTest.latency > 3000 && latencyTest.ok;
    
    return {
      available: corsTest.ok,
      status: corsTest.status,
      cors: corsTest.cors,
      latency: latencyTest.latency,
      possibleHibernation: hibernationTest,
      message: hibernationTest 
        ? "El servidor parece estar despertando de hibernación, los próximos intentos deberían funcionar."
        : latencyTest.latency > 1000 && latencyTest.ok
        ? "El servidor responde, pero con alta latencia. Es posible que algunas operaciones fallen por timeout."
        : corsTest.ok
        ? "El servidor está respondiendo normalmente."
        : "El servidor no está respondiendo correctamente."
    };
  } catch (error) {
    return {
      available: false,
      error: error.toString(),
      message: "Error al verificar estado del servidor: " + error.message
    };
  }
}

export async function fetchUsers() {
    return fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/usuarios`);
}

export async function fetchFoldersByUser(userId) {
    return fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/carpetas?usuario_id=${userId}`);
}

export async function fetchPictogramsByFolder(folderId) {
    try {
        const response = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/pictogramas?carpeta_id=${folderId}`);
        return response || [];
    } catch (error) {
        // Verificar si es el mensaje específico de "No se encontraron pictogramas"
        if (error.message && error.message.includes("No se encontraron pictogramas")) {
            console.log("No hay pictogramas en esta carpeta, retornando array vacío");
            return [];
        }
        
        // Si el status es 404, también retornar un array vacío
        if (error.message && error.message.includes("Status: 404")) {
            console.log("Carpeta sin pictogramas (404), retornando array vacío");
            return [];
        }
        
        throw error;
    }
}

export async function createFolder(userId, name) {
    console.log(`Intentando crear carpeta: nombre="${name}" para usuario=${userId}`);
    
    // Verificar datos de entrada
    if (!userId || !name) {
        console.error("Datos incompletos para crear carpeta", { userId, name });
        return { message: "Datos incompletos: se requiere ID de usuario y nombre de carpeta" };
    }
    
    try {
        // Asegurarse de que los datos sean del tipo correcto
        const data = {
            COD_USUARIO: parseInt(userId, 10),
            NOMBRE: String(name).trim()
        };
        
        console.log("Enviando solicitud para crear carpeta con datos:", data);
        
        const result = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/carpetas`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });
        
        console.log("Respuesta de creación de carpeta:", result);
        return result;
    } catch (error) {
        console.error("Error al crear carpeta:", error);
        return { 
            message: `Error al crear carpeta: ${error.message}`,
            error: error.toString() 
        };
    }
}

export async function deleteFolder(folderId) {
    return fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/carpetas/${folderId}`, {
        method: "DELETE",
    });
}

export async function createPictogram(folderId, phrase, photo) {
    const data = {
        COD_CARPETA: folderId,
        FRASE: phrase,
        PHOTO: photo  // También enviamos PHOTO para compatibilidad con el backend
    };

    console.log("Creando pictograma con datos:", {
        COD_CARPETA: folderId,
        FRASE: phrase,
        PHOTO: photo ? `Base64 image (length: ${photo.length})` : "No image"
    });

    try {
        // Primero verificamos que la imagen no sea demasiado grande
        if (photo && photo.length > 1000000) {
            console.warn("La imagen es muy grande, puede causar problemas con la base de datos");
        }

        const result = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/pictogramas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        
        return result;
    } catch (error) {
        console.error("Error al crear pictograma:", error);
        throw error;
    }
}

export async function deletePictogram(pictogramId) {
    return fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/pictogramas/${pictogramId}`, {
        method: "DELETE",
    });
}

export async function updateFolder(folderId, newName) {
    console.log(`Intentando actualizar carpeta ID=${folderId} con nuevo nombre="${newName}"`);
    
    // Verificar datos de entrada
    if (!folderId || !newName) {
        console.error("Datos incompletos para actualizar carpeta", { folderId, newName });
        return { message: "Datos incompletos: se requiere ID de carpeta y nuevo nombre" };
    }
    
    try {
        // Asegurarse de que los datos sean del tipo correcto
        const data = {
            NOMBRE: String(newName).trim()
        };
        
        if (data.NOMBRE.length === 0) {
            return { message: "El nombre de la carpeta no puede estar vacío" };
        }
        
        console.log("Enviando solicitud para actualizar carpeta con datos:", data);
        
        const result = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/carpetas/${folderId}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });
        
        console.log("Respuesta de actualización de carpeta:", result);
        
        if (result && result.message && result.message.includes("actualizada")) {
            return { success: true, message: result.message, id: folderId };
        } else {
            return result;
        }
    } catch (error) {
        console.error("Error al actualizar carpeta:", error);
        return { 
            success: false,
            message: `Error al actualizar carpeta: ${error.message}`,
            error: error.toString() 
        };
    }
}

export async function updatePictogram(pictogramId, updateData) {
    console.log(`Actualizando pictograma con ID=${pictogramId}`, updateData);
    
    // Verificar datos de entrada
    if (!pictogramId) {
        console.error("ID de pictograma no proporcionado");
        return { success: false, message: "Se requiere ID de pictograma" };
    }
    
    // Validar que hay datos a actualizar y asegurarse de que FRASE está siempre incluida
    if (!updateData.FRASE && !updateData.PHOTO && !updateData.PHOTO) {
        console.error("No se proporcionaron datos para actualizar");
        return { success: false, message: "Se requiere al menos frase o imagen para actualizar" };
    }
    
    try {
        // Preparar los datos para el envío
        const data = {};
        
        // SIEMPRE incluir la frase, incluso si solo se actualiza la imagen
        if (updateData.FRASE !== undefined) {
            data.FRASE = updateData.FRASE;
        }
        
        // Dar preferencia a FOTO sobre PHOTO para compatibilidad
        if (updateData.PHOTO) {
            data.PHOTO = updateData.PHOTO;
        } else if (updateData.PHOTO) {
            data.PHOTO = updateData.PHOTO;
        }
        
        console.log("Enviando solicitud para actualizar pictograma con datos:", {
            FRASE: data.FRASE,
            "Tamaño imagen": data.PHOTO ? `${data.PHOTO.length} caracteres` : "Sin cambios"
        });
        
        const result = await fetchWithRetriesAndErrorHandling(`${API_BASE_URL}/pictogramas/${pictogramId}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data)
        });
        
        console.log("Respuesta de actualización de pictograma:", result);
        
        if (result && result.message && result.message.includes("actualizado")) {
            return { success: true, message: result.message, id: pictogramId };
        } else {
            return { success: false, message: result.message || "Error desconocido al actualizar" };
        }
    } catch (error) {
        console.error("Error al actualizar pictograma:", error);
        return { 
            success: false,
            message: `Error al actualizar pictograma: ${error.message}`,
            error: error.toString() 
        };
    }
}