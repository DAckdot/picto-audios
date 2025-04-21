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
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import SideBar from "./components/SideBar.vue";
import PictogramGrid from "./components/PictogramGrid.vue";
import PistaReproduccion from "./components/PistaReproduccion.vue";
import { pictograms } from "./data/pictograms"; // Import pictograms
import { useSpeech } from "./composables/useSpeech";

// State
const sidebarOpen = ref(false);
const activeFolder = ref("saludos");
const queue = ref([]);

const { speak, stop } = useSpeech();

const folders = [
  { id: "saludos", name: "Saludos" },
  { id: "comida", name: "Comida" },
  { id: "actividades", name: "Actividades" },
  { id: "emociones", name: "Emociones" },
];

const currentFolder = computed(() => {
  return folders.find(folder => folder.id === activeFolder.value) || folders[0];
});

const filteredPictograms = computed(() => {
  return pictograms.filter(p => p.folder === activeFolder.value);
});

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const selectFolder = (folderId) => {
  activeFolder.value = folderId;
};

const playPictogram = (pictogram) => {
  speak(pictogram.label);
};

const addToQueue = (pictogram) => {
  queue.value.push(pictogram);
};

const updateQueue = (updatedQueue) => {
  queue.value = updatedQueue;
};
</script>