<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Header -->
    <PistaReproduccion 
      :queue="queue" 
      @update-queue="updateQueue"
    />

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <SideBar 
        :user-id="userId"
        :selected-folder="activeFolder" 
        @select-folder="selectFolder"
      />

      <!-- Main Content -->
      <main class="flex-1 overflow-hidden flex flex-col">
        <!-- Folder Title -->
        <div class="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">
            {{ currentFolder ? currentFolder.NOMBRE : "Selecciona una carpeta" }}
            <span class="text-xs text-gray-500 ml-2">(ID: {{ activeFolder }})</span>
          </h2>
          <div class="flex items-center">
            <div v-if="loadingFolders" class="text-sm text-gray-500 mr-4">
              Cargando carpetas...
            </div>
            <a 
              href="/diagnostico" 
              target="_blank" 
              title="Herramienta de diagnóstico"
              class="text-sm text-blue-500 hover:text-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Pictogram Grid -->
        <PictogramGrid 
          v-if="activeFolder" 
          :folder-id="activeFolder" 
          @play-pictogram="playPictogram" 
          @add-to-queue="addToQueue"
        />
        <div v-else class="flex-1 flex items-center justify-center text-gray-500">
          Selecciona una carpeta para ver sus pictogramas
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import SideBar from "./components/SideBar.vue";
import PictogramGrid from "./components/PictogramGrid.vue";
import PistaReproduccion from "./components/PistaReproduccion.vue";
import { useSpeech } from "./composables/useSpeech";
import { fetchFoldersByUser } from "./api";

const userId = ref(1); // Usuario predeterminado
const activeFolder = ref(null);
const queue = ref([]);
const folders = ref([]);
const loadingFolders = ref(true);

const { speak } = useSpeech();

const currentFolder = computed(() => {
  if (!activeFolder.value || !folders.value.length) return null;
  return folders.value.find(folder => folder.COD_CARPETA == activeFolder.value);
});

const loadFolders = async () => {
  try {
    loadingFolders.value = true;
    const response = await fetchFoldersByUser(userId.value);
    console.log("Carpetas cargadas:", response);
    
    if (Array.isArray(response)) {
      folders.value = response;
      // Establecer la primera carpeta como activa si no hay ninguna seleccionada
      if (!activeFolder.value && response.length > 0) {
        activeFolder.value = response[0].COD_CARPETA;
        console.log("Carpeta inicial seleccionada:", activeFolder.value);
      }
    } else {
      console.error("La respuesta no es un array:", response);
      folders.value = [];
    }
  } catch (error) {
    console.error("Error al cargar carpetas:", error);
    folders.value = [];
  } finally {
    loadingFolders.value = false;
  }
};

const selectFolder = (folderId) => {
  console.log("Carpeta seleccionada:", folderId);
  activeFolder.value = folderId;
};

const playPictogram = (pictogram) => {
  speak(pictogram.FRASE || pictogram.label);
};

const addToQueue = (pictogram) => {
  queue.value.push(pictogram);
};

const updateQueue = (updatedQueue) => {
  queue.value = updatedQueue;
};

onMounted(() => {
  loadFolders();
});
</script>