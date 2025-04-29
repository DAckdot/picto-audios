<template>
  <aside class="bg-gray-100 w-64 border-r border-gray-200 h-full flex-shrink-0">
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
          />
        </li>
      </ul>
      
      <div class="mt-6">
        <button 
          @click="addFolder" 
          class="w-full px-4 py-3 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 4v16m8-8H4" />
          </svg>
          Agregar Carpeta
        </button>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import FolderItem from "./FolderItem.vue";
import { fetchFoldersByUser, createFolder } from "../api";

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

const emit = defineEmits(["select-folder"]);

const searchQuery = ref("");
const folders = ref([]);
const loading = ref(true);
const error = ref(null);

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
  if (folderName && folderName.trim()) {
    try {
      loading.value = true;
      const result = await createFolder(props.userId, folderName.trim());
      console.log("Carpeta creada:", result);
      
      if (result.id) {
        // Recargar las carpetas después de crear una nueva
        await loadFolders();
        
        // Seleccionar la nueva carpeta
        selectFolder(result.id);
      } else {
        alert(result.message || "Error al crear la carpeta");
      }
    } catch (err) {
      console.error("Error al crear carpeta:", err);
      alert("Error al crear la carpeta. Intente de nuevo.");
    } finally {
      loading.value = false;
    }
  }
};

const selectFolder = (folderId) => {
  console.log("Carpeta seleccionada en SideBar:", folderId);
  emit("select-folder", folderId);
};

// Cargar carpetas al montar el componente
onMounted(loadFolders);

// Recargar carpetas si cambia el ID del usuario
watch(() => props.userId, loadFolders);
</script>