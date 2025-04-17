<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Mobile Header with Menu Toggle -->
    <header class="md:hidden flex items-center justify-between p-4 bg-white shadow">
      <button 
        @click="toggleSidebar" 
        class="p-2 rounded-md hover:bg-gray-100"
        aria-label="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-700"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
      </button>
      <div></div> <!-- Spacer for alignment -->
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
        <!-- Folder Title and Search -->
        <div class="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">
            {{ currentFolder.name }}
          </h2>
          <div class="relative">
            <input 
              type="text" 
              placeholder="Buscar pictogramas..."
                class="pl-12 pr-6 py-3 w-full border border-gray-300 rounded-lg bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              v-model="searchQuery"
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
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
import SideBar from "./components/SideBar.vue"
import PictogramGrid from "./components/PictogramGrid.vue"
import BottomBar from "./components/BottomBar.vue"

// State
const sidebarOpen = ref(false)
const activeFolder = ref("all")
const searchQuery = ref("")
const queue = ref([])

// Sample data
const folders = [
  { id: "all", name: "All", icon: "all" },
  { id: "animals", name: "Animals", icon: "animals" },
  { id: "food", name: "Food", icon: "food" },
  { id: "activities", name: "Activities", icon: "activities" },
  { id: "emotions", name: "Emotions", icon: "emotions" },
]

const pictograms = [
  { id: 1, label: "Dog", folder: "animals" },
  { id: 2, label: "Cat", folder: "animals" },
  { id: 3, label: "Apple", folder: "food" },
  { id: 4, label: "Banana", folder: "food" },
]

// Computed properties
const currentFolder = computed(() => {
  return folders.find(folder => folder.id === activeFolder.value) || folders[0]
})

const filteredPictograms = computed(() => {
  if (activeFolder.value === "all") return pictograms
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
  console.log(`Playing: ${pictogram.label}`)
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