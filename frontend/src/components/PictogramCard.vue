<template>
  <div class="pictogram-card-container relative">
    <div 
      class="pictogram-card flex flex-col items-center bg-white rounded-lg border border-lime-500 overflow-hidden hover:shadow-lg transition-shadow duration-200 w-full max-w-[200px] mx-auto aspect-square cursor-pointer"
      :class="{ 'bg-lime-200': isSelected }"
      @click="handleClick"
    >
      <img
        :src="getImageSource(pictogram)" 
        :alt="pictogram.FRASE || pictogram.label || 'Pictograma'" 
        class="object-contain h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
        @error="handleImageError"
      />
      <p class="text-sm sm:text-base md:text-sm font-medium text-lime-700 mt-2 text-center leading-tight">
        {{ pictogram.FRASE || pictogram.label }}
      </p>

      <!-- Botones flotantes de acción -->
      <div class="absolute top-1 right-1 flex space-x-1" @click.stop>
        <button 
          @click="openEditModal" 
          class="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md"
          title="Editar pictograma"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button 
          @click="confirmDelete" 
          class="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
          title="Eliminar pictograma"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Indicador de estado de operaciones -->
    <div v-if="status" :class="statusClass" class="text-xs p-1 mt-1 rounded text-center">
      {{ status }}
    </div>

    <!-- Modal de confirmación para eliminar pictograma -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="cancelDelete">
      <div class="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Confirmar eliminación</h3>
        <p class="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar el pictograma "<span class="font-semibold">{{ pictogram.FRASE || pictogram.label }}</span>"?
          <br><br>
          <span class="text-red-600 text-sm">Esta acción no se puede deshacer.</span>
        </p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="cancelDelete" 
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="deletePictogram"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            :disabled="isDeleting"
          >
            <span v-if="isDeleting">Eliminando...</span>
            <span v-else>Eliminar</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de edición -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="cancelEdit">
      <div class="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Editar Pictograma</h3>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Texto:</label>
          <input 
            v-model="editingText" 
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="Ingrese el nuevo texto"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Imagen:</label>
          <div class="flex items-center">
            <img 
              :src="editingPreviewImage || getImageSource(pictogram)" 
              alt="Vista previa" 
              class="h-20 w-20 object-contain border border-gray-300 rounded mr-3"
            />
            <label class="cursor-pointer px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              <span>Cambiar imagen</span>
              <input 
                type="file" 
                class="hidden" 
                accept="image/*" 
                @change="handleEditImageUpload"
              />
            </label>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            @click="cancelEdit" 
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="saveEdit"
            class="px-4 py-2 bg-lime-500 text-white rounded hover:bg-lime-600 transition-colors"
            :disabled="isEditing || (!editingText && !editingImage)"
          >
            <span v-if="isEditing">Guardando...</span>
            <span v-else>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import defaultImage from '../assets/picto_ex.png';
import { deletePictogram as apiDeletePictogram, updatePictogram } from '../api';

const props = defineProps({
  pictogram: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["click", "pictogram-updated", "pictogram-deleted"]);

const hasError = ref(false);
const status = ref('');
const statusClass = ref('');

// Variables para eliminación
const showDeleteModal = ref(false);
const isDeleting = ref(false);

// Variables para edición
const showEditModal = ref(false);
const isEditing = ref(false);
const editingText = ref('');
const editingImage = ref(null);
const editingPreviewImage = ref(null);

const handleClick = () => {
  emit("click", props.pictogram);
};

const handleImageError = () => {
  hasError.value = true;
};

const getImageSource = (pictogram) => {
  // Si hay un error al cargar la imagen o no tiene una imagen válida, usar la imagen por defecto
  if (hasError.value) {
    return defaultImage;
  }
  
  // Si viene de la API, la imagen está en pictogram.PHOTO o pictogram.FOTO
  if (pictogram.PHOTO) {
    // Verificar si ya es una URL de datos completa
    if (typeof pictogram.PHOTO === 'string' && pictogram.PHOTO.startsWith('data:')) {
      return pictogram.PHOTO;
    }
    // Si no es una cadena o está vacía, usar la imagen por defecto
    if (typeof pictogram.PHOTO !== 'string' || !pictogram.PHOTO) {
      return defaultImage;
    }
    // De lo contrario, asumimos que es una cadena base64 y construimos la URL
    return `data:image/jpeg;base64,${pictogram.PHOTO}`;
  }
  
  // También revisar el campo correcto FOTO si existe
  if (pictogram.FOTO) {
    // Verificar si ya es una URL de datos completa
    if (typeof pictogram.FOTO === 'string' && pictogram.FOTO.startsWith('data:')) {
      return pictogram.FOTO;
    }
    // Si no es una cadena o está vacía, usar la imagen por defecto
    if (typeof pictogram.FOTO !== 'string' || !pictogram.FOTO) {
      return defaultImage;
    }
    // De lo contrario, asumimos que es una cadena base64 y construimos la URL
    return `data:image/jpeg;base64,${pictogram.FOTO}`;
  }
  
  // Si viene de datos locales, la imagen está en pictogram.image
  if (pictogram.image) {
    return pictogram.image;
  }
  
  // Si no tiene ninguna, usar la imagen por defecto
  return defaultImage;
};

// MÉTODOS PARA ELIMINAR

const confirmDelete = () => {
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
};

const deletePictogram = async () => {
  if (!props.pictogram.COD_PICTOGRAMA) {
    status.value = "No se puede eliminar: ID no disponible";
    statusClass.value = "bg-red-100 text-red-700";
    showDeleteModal.value = false;
    return;
  }
  
  try {
    isDeleting.value = true;
    const result = await apiDeletePictogram(props.pictogram.COD_PICTOGRAMA);
    
    if (result && result.message && result.message.includes("eliminado")) {
      // Éxito - notificar al componente padre
      emit("pictogram-deleted", props.pictogram.COD_PICTOGRAMA);
      status.value = "Pictograma eliminado";
      statusClass.value = "bg-green-100 text-green-700";
    } else {
      // Error con mensaje del servidor
      status.value = result && result.message ? result.message : "Error al eliminar";
      statusClass.value = "bg-red-100 text-red-700";
    }
  } catch (error) {
    console.error("Error al eliminar pictograma:", error);
    status.value = `Error: ${error.message || 'Error desconocido'}`;
    statusClass.value = "bg-red-100 text-red-700";
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
    
    // Limpiar el mensaje después de unos segundos
    setTimeout(() => {
      status.value = '';
    }, 3000);
  }
};

// MÉTODOS PARA EDICIÓN

const openEditModal = () => {
  // Asegurarse de que siempre tengamos acceso a la frase original
  editingText.value = props.pictogram.FRASE || props.pictogram.label || '';
  editingImage.value = null;
  editingPreviewImage.value = null;
  showEditModal.value = true;
};

const cancelEdit = () => {
  showEditModal.value = false;
  editingText.value = '';
  editingImage.value = null;
  editingPreviewImage.value = null;
};

const handleEditImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    editingImage.value = file;
    
    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = (e) => {
      editingPreviewImage.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Función para comprimir imagen antes de subir
const compressImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 120; // Tamaño máximo para compatibilidad
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
        
        // Compresión del 80%
        const compressedImage = canvas.toDataURL("image/jpeg", 0.2);
        resolve(compressedImage);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const saveEdit = async () => {
  if (!props.pictogram.COD_PICTOGRAMA) {
    status.value = "No se puede editar: ID no disponible";
    statusClass.value = "bg-red-100 text-red-700";
    showEditModal.value = false;
    return;
  }
  
  try {
    isEditing.value = true;
    
    // Preparar datos para actualización
    const updateData = {};
    
    // SIEMPRE incluir la frase actual o la frase editada
    updateData.FRASE = editingText.value.trim() || props.pictogram.FRASE || props.pictogram.label || '';
    
    // Si se seleccionó una nueva imagen
    if (editingImage.value) {
      const compressedImage = await compressImageToBase64(editingImage.value);
      updateData.PHOTO = compressedImage;
    }
    
    // Verificar si hay datos para actualizar
    if (updateData.FRASE === (props.pictogram.FRASE || props.pictogram.label || '') && !editingImage.value) {
      status.value = "No hay cambios para guardar";
      statusClass.value = "bg-yellow-100 text-yellow-700";
      showEditModal.value = false;
      isEditing.value = false;
      return;
    }
    
    console.log("Enviando actualización con datos:", {
      id: props.pictogram.COD_PICTOGRAMA,
      FRASE: updateData.FRASE,
      tieneImagen: editingImage.value ? "Sí" : "No"
    });
    
    // Realizar la actualización
    const result = await updatePictogram(props.pictogram.COD_PICTOGRAMA, updateData);
    
    if (result.success) {
      // Actualización exitosa
      status.value = "Pictograma actualizado";
      statusClass.value = "bg-green-100 text-green-700";
      
      // Notificar al componente padre sobre la actualización
      const updatedPictogram = {
        ...props.pictogram,
        FRASE: updateData.FRASE,
        PHOTO: updateData.PHOTO || props.pictogram.PHOTO || null
      };
      
      emit("pictogram-updated", updatedPictogram);
    } else {
      // Error con mensaje del servidor
      status.value = result.message || "Error al actualizar";
      statusClass.value = "bg-red-100 text-red-700";
    }
  } catch (error) {
    console.error("Error al actualizar pictograma:", error);
    status.value = `Error: ${error.message || 'Error desconocido'}`;
    statusClass.value = "bg-red-100 text-red-700";
  } finally {
    isEditing.value = false;
    showEditModal.value = false;
    
    // Limpiar el mensaje después de unos segundos
    setTimeout(() => {
      status.value = '';
    }, 3000);
  }
};
</script>

<style scoped>
.pictogram-card {
  border: 1px solid #ccc;
  padding: 16px;
  text-align: center;
  position: relative;
}

/* Añadir efecto de aparición gradual a los botones */
.pictogram-card:hover .absolute {
  opacity: 1;
}

.pictogram-card .absolute {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}
</style>