<template>
  <div class="p-4 h-full overflow-auto custom-scrollbar md:overflow-scroll">
    <!-- Alerta de error -->
    <div v-if="errorMessage" class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <strong class="font-bold">Error: </strong>
      <span class="block sm:inline">{{ errorMessage }}</span>
      <button @click="testConnection" class="ml-2 bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs">
        Probar conexión
      </button>
    </div>
    
    <!-- Información de diagnóstico -->
    <div v-if="connectionStatus" class="mb-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
      <strong class="font-bold">Estado: </strong>
      <span class="block sm:inline">{{ connectionStatus }}</span>
    </div>
    
    <!-- Indicador de carga para pictogramas -->
    <div v-if="loadingPictograms" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mr-2"></div>
      <span>Cargando pictogramas...</span>
    </div>
    
    <!-- Resto del contenido -->
    <div v-else-if="pictograms.length === 0" class="flex flex-col items-center space-y-6">
      <div class="text-center text-gray-500 mt-8 mb-4">
        No se encontraron pictogramas en esta carpeta (ID: {{ folderId }})
      </div>
      
      <div 
        class="flex flex-col items-center justify-center bg-gray-200 border border-dashed border-gray-400 rounded-lg p-6 cursor-pointer hover:bg-gray-300 w-64 h-64"
        @click="openModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M12 4v16m8-8H4" />
        </svg>
        <span class="text-gray-700 mt-4 font-medium">Agregar primer pictograma</span>
        <span class="text-gray-500 text-sm mt-2 text-center">Haz clic para subir un pictograma a esta carpeta</span>
      </div>
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <PictogramCard 
        v-for="pictogram in pictograms" 
        :key="pictogram.id" 
        :pictogram="pictogram" 
        @click="$emit('play-pictogram', pictogram)" 
      />
      <div 
        class="flex flex-col items-center justify-center bg-gray-200 border border-dashed border-gray-400 rounded-lg p-4 cursor-pointer hover:bg-gray-300"
        @click="openModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M12 4v16m8-8H4" />
        </svg>
        <span class="text-gray-500 mt-2">Subir Pictograma</span>
      </div>
    </div>
  </div>

  <!-- Modal de carga para subir pictograma -->
  <div v-if="isLoading" class="modal-overlay flex items-center justify-center">
    <div class="bg-white p-5 rounded-lg shadow-lg text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
      <p>Subiendo pictograma...</p>
    </div>
  </div>

  <div v-if="isModalOpen" class="modal-overlay">
    <div class="modal-content">
      <h2 class="text-lg font-bold mb-4">Subir Nuevo Pictograma</h2>
      <p class="text-sm text-gray-600 mb-4">Carpeta ID: {{ folderId }}</p>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Imagen:</label>
        <input 
          type="file" 
          accept="image/*" 
          @change="handleFileUpload" 
          class="input-field"
        />
        <div v-if="previewImage" class="mt-2 flex justify-center">
          <img :src="previewImage" alt="Vista previa" class="h-32 object-contain border border-gray-300 rounded p-1" />
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Etiqueta:</label>
        <input 
          v-model="newPictogramLabel" 
          type="text" 
          placeholder="Ingrese el texto asociado a la imagen" 
          class="input-field"
        />
      </div>
      
      <div class="modal-actions">
        <button 
          @click="uploadPictogram" 
          class="btn-primary"
          :disabled="!selectedFile || !newPictogramLabel.trim()"
          :class="{'opacity-50 cursor-not-allowed': !selectedFile || !newPictogramLabel.trim()}"
        >
          Subir
        </button>
        <button @click="closeModal" class="btn-secondary">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import PictogramCard from "./PictogramCard.vue";
import { fetchPictogramsByFolder, createPictogram, checkConnection } from "../api";

const props = defineProps({
  folderId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["add-to-queue"]);

// Variables de estado separadas para diferentes tipos de carga
const pictograms = ref([]);
const isModalOpen = ref(false);
const newPictogramLabel = ref("");
const selectedFile = ref(null);
const previewImage = ref(null);
const errorMessage = ref("");
const connectionStatus = ref("");
// Estado de carga para subir pictogramas (esto controla el modal de carga)
const isLoading = ref(false);
// Estado de carga para obtener pictogramas de una carpeta (esto controla el spinner en la vista)
const loadingPictograms = ref(false);

// Función para probar la conexión con el backend
const testConnection = async () => {
  try {
    const result = await checkConnection();
    if (result.connected) {
      connectionStatus.value = `Conectado (Status: ${result.status})`;
    } else {
      connectionStatus.value = `Error de conexión: ${result.error || result.statusText}`;
    }
    
    // Limpiar el mensaje después de 5 segundos
    setTimeout(() => {
      connectionStatus.value = "";
    }, 5000);
  } catch (error) {
    connectionStatus.value = `Error: ${error.message}`;
  }
};

const loadPictograms = async () => {
  try {
    loadingPictograms.value = true;
    errorMessage.value = "";
    console.log("Cargando pictogramas para carpeta ID:", props.folderId);
    const response = await fetchPictogramsByFolder(props.folderId);
    
    if (response.message === "No se encontraron pictogramas") {
      console.log("No hay pictogramas en esta carpeta");
      pictograms.value = [];
    } else {
      console.log("Pictogramas cargados:", response);
      pictograms.value = response;
    }
  } catch (error) {
    console.error("Error al cargar pictogramas:", error);
    errorMessage.value = `No se pudieron cargar los pictogramas: ${error.message}`;
    pictograms.value = [];
  } finally {
    loadingPictograms.value = false;
  }
};

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  newPictogramLabel.value = "";
  selectedFile.value = null;
  previewImage.value = null;
};

const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0];
  
  // Mostrar vista previa
  if (selectedFile.value) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.value = e.target.result;
    };
    reader.readAsDataURL(selectedFile.value);
  }
};

// Mejorar significativamente la compresión de imágenes
const compressImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Reducir drásticamente el tamaño máximo para garantizar compatibilidad
        const maxSize = 100; // Aún más pequeño para asegurar tamaños compatibles con el backend
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round(height * maxSize / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round(width * maxSize / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        // Usar una compresión extrema (0.1 = 90% de compresión)
        const compressedImage = canvas.toDataURL("image/jpeg", 0.1);
        console.log(`Imagen comprimida de ${width}x${height} píxeles, tamaño: ${compressedImage.length} caracteres`);
        resolve(compressedImage);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const uploadPictogram = async () => {
  if (!selectedFile.value || !newPictogramLabel.value.trim()) {
    alert("Por favor, selecciona una imagen y proporciona una etiqueta.");
    return;
  }

  try {
    errorMessage.value = "";
    isLoading.value = true;
    console.log("Subiendo pictograma a carpeta ID:", props.folderId);
    const compressedImage = await compressImageToBase64(selectedFile.value);
    
    // Verificar tamaño de la imagen comprimida
    console.log(`Tamaño de la imagen comprimida: ${compressedImage.length} caracteres`);
    
    if (compressedImage.length > 500000) { // Reducido a 500KB
      errorMessage.value = "La imagen es demasiado grande. Intenta con una imagen más pequeña.";
      alert("La imagen es demasiado grande incluso después de comprimirla. Por favor, selecciona una imagen más pequeña o con menos detalle.");
      isLoading.value = false;
      return;
    }
    
    const result = await createPictogram(props.folderId, newPictogramLabel.value, compressedImage);
    console.log("Resultado de la subida:", result);
    
    if (result.message && result.message.includes("Error")) {
      errorMessage.value = result.message;
      alert(`Error: ${result.message}`);
    } else if (result.error) {
      errorMessage.value = `Error: ${result.error}`;
      alert(`Error del servidor: ${result.error}`);
    } else {
      await loadPictograms();
      closeModal();
      // Mostrar mensaje de éxito
      connectionStatus.value = "Pictograma creado correctamente";
      setTimeout(() => {
        connectionStatus.value = "";
      }, 3000);
    }
  } catch (error) {
    console.error("Error al subir el pictograma:", error);
    errorMessage.value = `Error al subir el pictograma: ${error.message}`;
    alert("Ocurrió un error al subir el pictograma. Por favor, intenta de nuevo.");
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  console.log("Componente PictogramGrid montado, carpeta ID:", props.folderId);
  loadPictograms();
});

watch(() => props.folderId, (newId, oldId) => {
  console.log(`Carpeta ID cambió de ${oldId} a ${newId}`);
  loadPictograms();
});
</script>

<style scoped>
/* Scroll personalizado */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #0406042b #f0f0f0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #4caf50;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background-color: #f0f0f0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
  text-align: center;
}

.input-field {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background-color: #f44336;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>