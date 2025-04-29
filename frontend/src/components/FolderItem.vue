<template>
  <div class="folder-item-container relative">
    <div 
      class="folder-item flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200"
      :class="{
        'bg-green-500 text-white': isSelected,
        'hover:bg-gray-200': !isSelected,
      }"
    >
      <div class="flex items-center flex-grow" @click="selectFolder">
        <div class="icon w-8 h-8 flex items-center justify-center bg-gray-300 rounded-md mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M3 7h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
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
      </div>
    </div>
    
    <!-- Mensajes de estado -->
    <div v-if="status" :class="statusClass" class="text-xs p-1 mt-1 rounded text-center">
      {{ status }}
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { updateFolder } from "../api";

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

const emit = defineEmits(["select-folder", "folder-updated"]);

const isEditing = ref(false);
const editingName = ref("");
const nameInput = ref(null);
const status = ref("");
const statusClass = ref(""); // Para cambiar el color del mensaje

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
</script>

<style scoped>
.folder-item {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
