<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <header class="flex items-center justify-between p-4 bg-white shadow">
      <button 
        @click="toggleSidebar" 
        class="p-2 rounded-md hover:bg-gray-100"
        aria-label="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-700">
          <line x1="3" x2="21" y1="6" y2="6"/>
          <line x1="3" x2="21" y1="12" y2="12"/>
          <line x1="3" x2="21" y1="18" y2="18"/>
        </svg>
      </button>
      <div class="relative w-1/2">
        <input 
          type="text" 
          id="search-pictograms"
          placeholder="Buscar pictogramas..."
          class="pl-12 pr-6 py-3 w-full border border-gray-300 rounded-lg bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          v-model="searchQuery"
        />
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.3-4.3"/>
        </svg>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <SideBar 
        :folders="folders" 
        :selected-folder="activeFolder" 
        :is-open="sidebarOpen" 
        @select-folder="selectFolder" 
        @close-sidebar="toggleSidebar"
      />

      <!-- Main Content -->
      <main class="flex-1 overflow-hidden flex flex-col">
        <!-- Folder Title -->
        <div class="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">
            {{ currentFolder.name }}
          </h2>
        </div>

        <!-- Pictogram Grid -->
        <PictogramGrid 
          :pictograms="filteredPictograms" 
          @play-pictogram="playPictogram" 
          @add-to-queue="addToQueue"
        />
      </main>
    </div>

    <!-- Bottom Queue Bar -->
    <BottomBar 
      :queue="queue" 
      @play-queue="playQueue" 
      @remove-from-queue="removeFromQueue"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useSpeechHandler } from "./composables/useSpeechHandler"
import SideBar from "./components/SideBar.vue"
import PictogramGrid from "./components/PictogramGrid.vue"
import BottomBar from "./components/BottomBar.vue"

// State
const sidebarOpen = ref(false)
const activeFolder = ref("saludos") // Default to the first folder
const searchQuery = ref("")
const queue = ref([])

// Speech handler
const { speak, stop } = useSpeechHandler()

// Sample data
const folders = [
  { id: "saludos", name: "Saludos", icon: "saludos" },
  { id: "comida", name: "Comida", icon: "comida" },
  { id: "actividades", name: "Actividades", icon: "actividades" },
  { id: "emociones", name: "Emociones", icon: "emociones" },
]

const pictograms = [
  { id: 1, label: "Hola", folder: "saludos" },
  { id: 2, label: "Que tal", folder: "saludos" },
  { id: 3, label: "Buenos días", folder: "saludos" },
  { id: 4, label: "Buenas noches", folder: "saludos" },
  { id: 5, label: "Adiós", folder: "saludos" },
  { id: 6, label: "Hasta luego", folder: "saludos" },
  { id: 7, label: "Gracias", folder: "saludos" },
  { id: 8, label: "Por favor", folder: "saludos" },
  { id: 9, label: "De nada", folder: "saludos" },
  { id: 10, label: "Lo siento", folder: "saludos" },
  { id: 11, label: "Manzana", folder: "comida" },
  { id: 12, label: "Plátano", folder: "comida" },
  { id: 13, label: "Naranja", folder: "comida" },
  { id: 14, label: "Sandía", folder: "comida" },
  { id: 15, label: "Fresa", folder: "comida" },
  { id: 16, label: "Uva", folder: "comida" },
  { id: 17, label: "Pera", folder: "comida" },
  { id: 18, label: "Melón", folder: "comida" },
  { id: 19, label: "Durazno", folder: "comida" },
  { id: 20, label: "Cereza", folder: "comida" },
  { id: 21, label: "Correr", folder: "actividades" },
  { id: 22, label: "Saltar", folder: "actividades" },
  { id: 23, label: "Leer", folder: "actividades" },
  { id: 24, label: "Escribir", folder: "actividades" },
  { id: 25, label: "Dibujar", folder: "actividades" },
  { id: 26, label: "Cantar", folder: "actividades" },
  { id: 27, label: "Bailar", folder: "actividades" },
  { id: 28, label: "Jugar", folder: "actividades" },
  { id: 29, label: "Cocinar", folder: "actividades" },
  { id: 30, label: "Nadar", folder: "actividades" },
  { id: 31, label: "Feliz", folder: "emociones" },
  { id: 32, label: "Triste", folder: "emociones" },
  { id: 33, label: "Enojado", folder: "emociones" },
  { id: 34, label: "Sorprendido", folder: "emociones" },
  { id: 35, label: "Asustado", folder: "emociones" },
  { id: 36, label: "Cansado", folder: "emociones" },
  { id: 37, label: "Aburrido", folder: "emociones" },
  { id: 38, label: "Nervioso", folder: "emociones" },
  { id: 39, label: "Emocionado", folder: "emociones" },
  { id: 40, label: "Orgulloso", folder: "emociones" },
]

// Computed properties
const currentFolder = computed(() => {
  return folders.find(folder => folder.id === activeFolder.value) || folders[0]
})

const filteredPictograms = computed(() => {
  return pictograms.filter(p => p.folder === activeFolder.value)
})

// Methods
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const selectFolder = (folderId) => {
  activeFolder.value = folderId
}

const playPictogram = (pictogram) => {
  speak(pictogram.label) // Usa el método speak del handler
}

const addToQueue = (pictogram) => {
  queue.value.push(pictogram)
}

const removeFromQueue = (index) => {
  queue.value.splice(index, 1)
}

const playQueue = () => {
  console.log("Playing queue:", queue.value)
}
</script>