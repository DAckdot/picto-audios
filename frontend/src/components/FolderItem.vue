<template>
  <div class="folder-item-container relative">
    <div 
      class="folder-item flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200"
      :class="{
        'bg-lime-400 text-white': isSelected,
        'hover:bg-gray-200': !isSelected,
      }"
    >
      <div class="flex items-center flex-grow" @click="selectFolder">
        <div class="icon w-8 h-8 flex items-center justify-center bg-gray-300 rounded-md mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M3 7h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a 2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
            <path d="M3 7l3-3h12l3 3" />
          </svg>
        </div>
        
        <!-- Modo de edición -->
        <input 
          v-if="isEditing" 
          type="text" 
          v-model="editingName" 
          class="border border-gray-300 rounded py-1 px-2 text-gray-700 flex-grow"
          ref="nameInput"
          @keyup.enter="saveEdit"
          @keyup.esc="cancelEdit"
          @click.stop
        />
        
        <!-- Modo normal -->
        <span v-else class="folder-name font-bold text-xs">{{ folder.name }}</span>
      </div>
      
      <!-- Botones de acción -->
      <div class="actions flex items-center ml-2" @click.stop>
        <button 
          v-if="isEditing"
          @click="saveEdit" 
          class="p-1 text-blue-500 hover:text-blue-700"
          title="Guardar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        
        <button 
          v-if="isEditing"
          @click="cancelEdit" 
          class="p-1 text-red-500 hover:text-red-700"
          title="Cancelar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <button 
          v-if="!isEditing"
          @click="startEdit" 
          class="p-1 text-gray-500 hover:text-gray-700"
          title="Editar nombre"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        <!-- Botón para eliminar carpeta -->
        <button 
          v-if="!isEditing"
          @click="showDeleteConfirmation" 
          class="p-1 ml-1 text-red-500 hover:text-red-700"
          title="Eliminar carpeta"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Mensajes de estado -->
    <div v-if="status" :class="statusClass" class="text-xs p-1 mt-1 rounded text-center">
      {{ status }}
    </div>

    <!-- Modal de confirmación para eliminar carpeta -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="cancelDelete">
      <div class="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Confirmar eliminación</h3>
        <p class="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar la carpeta "<span class="font-semibold">{{ folder.name }}</span>"?
          <br><br>
          <span class="text-red-600 text-sm">Esta acción no se puede deshacer y eliminará todos los contenidos de la carpeta.</span>
        </p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="cancelDelete" 
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="confirmDelete"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            :disabled="isDeleting"
          >
            <span v-if="isDeleting">Eliminando...</span>
            <span v-else>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { updateFolder, deleteFolder } from "../api";

const props = defineProps({
  folder: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select-folder", "folder-updated", "folder-deleted"]);

const isEditing = ref(false);
const editingName = ref("");
const nameInput = ref(null);
const status = ref("");
const statusClass = ref(""); // Para cambiar el color del mensaje

// Variables para el modal de eliminación
const showDeleteModal = ref(false);
const isDeleting = ref(false);

const selectFolder = () => {
  // Solo seleccionar la carpeta si no estamos en modo edición
  if (!isEditing.value) {
    emit("select-folder", props.folder.id);
  }
};

const startEdit = () => {
  editingName.value = props.folder.name;
  isEditing.value = true;
  
  // Enfocar el campo de entrada después del renderizado
  nextTick(() => {
    nameInput.value?.focus();
  });
};

const cancelEdit = () => {
  isEditing.value = false;
  status.value = "";
};

const saveEdit = async () => {
  // Validar que el nombre no esté vacío
  if (!editingName.value.trim()) {
    status.value = "El nombre no puede estar vacío";
    statusClass.value = "bg-red-100 text-red-700";
    return;
  }
  
  // Si el nombre no cambió, simplemente cerrar el modo edición
  if (editingName.value === props.folder.name) {
    isEditing.value = false;
    return;
  }
  
  try {
    status.value = "Guardando...";
    statusClass.value = "bg-blue-100 text-blue-700";
    
    const result = await updateFolder(props.folder.id, editingName.value);
    
    if (result.success) {
      status.value = "¡Carpeta actualizada!";
      statusClass.value = "bg-green-100 text-green-700";
      
      // Emitir evento para actualizar la lista de carpetas
      emit("folder-updated", {
        id: props.folder.id,
        name: editingName.value
      });
      
      // Cerrar modo edición después de 1.5 segundos
      setTimeout(() => {
        isEditing.value = false;
        status.value = "";
      }, 1500);
    } else {
      status.value = result.message || "Error al actualizar";
      statusClass.value = "bg-red-100 text-red-700";
    }
  } catch (error) {
    console.error("Error al actualizar carpeta:", error);
    status.value = `Error: ${error.message}`;
    statusClass.value = "bg-red-100 text-red-700";
  }
};

// Funciones para el manejo de eliminación de carpetas
const showDeleteConfirmation = () => {
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
};

const confirmDelete = async () => {
  try {
    isDeleting.value = true;
    
    console.log(`Eliminando carpeta con ID: ${props.folder.id}`);
    const result = await deleteFolder(props.folder.id);
    
    if (result && result.message && result.message.includes("eliminada")) {
      // La carpeta se eliminó correctamente
      emit("folder-deleted", props.folder.id);
      showDeleteModal.value = false;
      
      // Mostrar mensaje de éxito momentáneamente
      status.value = "Carpeta eliminada correctamente";
      statusClass.value = "bg-green-100 text-green-700";
      setTimeout(() => {
        status.value = "";
      }, 2000);
    } else if (result && result.message) {
      // Error específico del servidor
      status.value = result.message;
      statusClass.value = "bg-red-100 text-red-700";
      showDeleteModal.value = false;
    } else {
      throw new Error("Respuesta inesperada del servidor");
    }
  } catch (error) {
    console.error("Error al eliminar carpeta:", error);
    status.value = `Error: ${error.message}`;
    statusClass.value = "bg-red-100 text-red-700";
    showDeleteModal.value = false;
  } finally {
    isDeleting.value = false;
  }
};
</script>

<style scoped>
.folder-item {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
