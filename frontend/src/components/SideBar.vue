<template>
  <aside class="bg-gray-100 w-64 border-r border-gray-200 h-full flex-shrink-0">
    <div class="p-4 border-b border-gray-200 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-gray-800">Usuario: {{ props.userId }}</h2>
      <div class="relative">
        <button 
          @click="toggleUserDropdown"
          class="p-2 rounded-md hover:bg-gray-200 transition-colors"
          title="Cambiar usuario"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        
        <!-- Dropdown Menu -->
        <div 
          v-if="showUserDropdown" 
          class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
        >
          <div v-if="loadingUsers" class="p-3 text-sm text-gray-600">
            Cargando usuarios...
          </div>
          <div v-else-if="users.length === 0" class="p-3 text-sm text-gray-600">
            No hay usuarios disponibles
          </div>
          <div v-else class="py-1">
            <button 
              v-for="user in users" 
              :key="user.COD_USUARIO"
              @click="changeUser(user.COD_USUARIO)"
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              :class="{'bg-gray-100': user.COD_USUARIO === props.userId}"
            >
              {{ user.NOMBRE_USU }}
              <span v-if="user.COD_USUARIO === props.userId" class="ml-2 text-xs text-green-600">(Actual)</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="p-4 border-b border-gray-200">
      <input 
        type="text" 
        placeholder="Buscar carpetas..." 
        v-model="searchQuery"
        id="search-folders"
        name="search-folders"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
      />
    </div>
    
    <div v-if="folderStatus" :class="folderStatusClass" class="p-2 m-2 text-sm rounded">
      {{ folderStatus }}
    </div>
    
    <div v-if="loading" class="p-4 text-center text-gray-500">
      Cargando carpetas...
    </div>
    
    <div v-else-if="error" class="p-4 text-center text-red-500">
      {{ error }}
    </div>
    
    <nav v-else class="p-4 overflow-y-auto h-[calc(100%-4rem)]">
      <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Carpetas</h2>
      
      <div v-if="filteredFolders.length === 0" class="text-center text-gray-500 mb-4">
        No se encontraron carpetas
      </div>
      
      <ul v-else class="space-y-2">
        <li v-for="folder in filteredFolders" :key="folder.COD_CARPETA">
          <FolderItem 
            :folder="{
              id: folder.COD_CARPETA,
              name: folder.NOMBRE
            }" 
            :isSelected="selectedFolder == folder.COD_CARPETA" 
            @select-folder="selectFolder"
            @folder-updated="handleFolderUpdated"
          />
        </li>
      </ul>
      
      <div class="mt-6">
        <button 
          @click="addFolder" 
          class="w-full px-4 py-3 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
          :disabled="isCreatingFolder"
        >
          <div v-if="isCreatingFolder" class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 4v16m8-8H4" />
          </svg>
          {{ isCreatingFolder ? 'Creando...' : 'Agregar Carpeta' }}
        </button>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import FolderItem from "./FolderItem.vue";
import { fetchFoldersByUser, createFolder, fetchUsers } from "../api";

const props = defineProps({
  userId: {
    type: Number,
    required: true,
  },
  selectedFolder: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(["select-folder", "change-user"]);

const searchQuery = ref("");
const folders = ref([]);
const loading = ref(true);
const error = ref(null);
const showUserDropdown = ref(false);
const users = ref([]);
const loadingUsers = ref(false);
const isCreatingFolder = ref(false);
const folderStatus = ref("");
const folderStatusClass = ref("");

const filteredFolders = computed(() => {
  if (!searchQuery.value.trim()) return folders.value;
  return folders.value.filter(folder =>
    folder.NOMBRE.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const loadFolders = async () => {
  try {
    loading.value = true;
    error.value = null;
    console.log("Cargando carpetas para usuario ID:", props.userId);
    const response = await fetchFoldersByUser(props.userId);
    
    if (response.message) {
      // Es un mensaje de error o "No se encontraron carpetas"
      error.value = response.message;
      folders.value = [];
    } else {
      folders.value = response;
      console.log("Carpetas cargadas:", folders.value);
    }
  } catch (err) {
    console.error("Error al cargar carpetas:", err);
    error.value = "Error al cargar las carpetas";
    folders.value = [];
  } finally {
    loading.value = false;
  }
};

const addFolder = async () => {
  const folderName = prompt("Ingrese el nombre de la nueva carpeta:");
  if (!folderName) return; // Si el usuario cancela o no ingresa nada
  
  const trimmedName = folderName.trim();
  if (!trimmedName) {
    alert("El nombre de la carpeta no puede estar vacío");
    return;
  }
  
  try {
    isCreatingFolder.value = true;
    folderStatus.value = "Creando carpeta...";
    folderStatusClass.value = "bg-blue-100 text-blue-700";
    
    console.log(`Intentando crear carpeta '${trimmedName}' para usuario ${props.userId}`);
    
    const result = await createFolder(props.userId, trimmedName);
    console.log("Respuesta de crear carpeta:", result);
    
    if (result.id) {
      folderStatus.value = "¡Carpeta creada exitosamente!";
      folderStatusClass.value = "bg-green-100 text-green-700";
      
      // Recargar las carpetas después de crear una nueva
      await loadFolders();
      
      // Seleccionar la nueva carpeta
      selectFolder(result.id);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        folderStatus.value = "";
      }, 3000);
    } else {
      folderStatus.value = result.message || "Error al crear la carpeta";
      folderStatusClass.value = "bg-red-100 text-red-700";
      console.error("Error al crear carpeta:", result);
    }
  } catch (err) {
    console.error("Error al crear carpeta:", err);
    folderStatus.value = `Error: ${err.message}`;
    folderStatusClass.value = "bg-red-100 text-red-700";
  } finally {
    isCreatingFolder.value = false;
  }
};

const selectFolder = (folderId) => {
  console.log("Carpeta seleccionada en SideBar:", folderId);
  emit("select-folder", folderId);
};

const loadUsers = async () => {
  try {
    loadingUsers.value = true;
    const response = await fetchUsers();
    if (Array.isArray(response)) {
      users.value = response;
    } else {
      console.error("Error al cargar usuarios:", response);
    }
  } catch (err) {
    console.error("Error al cargar usuarios:", err);
  } finally {
    loadingUsers.value = false;
  }
};

const changeUser = (userId) => {
  showUserDropdown.value = false;
  emit("change-user", userId);
};

const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value;
  if (showUserDropdown.value && users.value.length === 0) {
    loadUsers();
  }
};

// Cargar carpetas al montar el componente
onMounted(() => {
  loadFolders();
});

// Recargar carpetas si cambia el ID del usuario
watch(() => props.userId, loadFolders);

// Función para manejar la actualización del nombre de una carpeta
const handleFolderUpdated = (updatedFolder) => {
  // Buscar la carpeta en el array y actualizar su nombre
  const folderIndex = folders.value.findIndex(f => f.COD_CARPETA == updatedFolder.id);
  if (folderIndex >= 0) {
    folders.value[folderIndex].NOMBRE = updatedFolder.name;
  }
};
</script>