<template>
  <aside 
    :class="[
      'bg-primary w-64 border-r border-primary-dark transition-transform duration-300 ease-in-out',
      'h-full flex-shrink-0'
    ]"
  >
    <div class="p-4 border-b border-primary-dark">
      <input 
        type="text" 
        placeholder="Buscar carpetas..." 
        v-model="searchQuery"
        id="search-folders"
        name="search-folders"
        class="w-full px-3 py-2 border border-primary-light rounded-full bg-secondary text-primary focus:ring-2 focus:ring-primary focus:outline-none"
      />
    </div>
    <nav class="p-4 overflow-y-auto h-full">
      <h2 class="text-sm font-semibold text-secondary uppercase tracking-wider mb-4">Carpetas</h2>
      <ul class="space-y-2">
        <li v-for="folder in filteredFolders" :key="folder.id">
          <FolderItem 
            :folder="folder" 
            :isSelected="selectedFolder === folder.id" 
            @select-folder="selectFolder"
          />
        </li>
      </ul>
      <div class="mt-4">
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
import { ref, computed } from "vue"
import FolderItem from "./FolderItem.vue"

const props = defineProps({
  folders: {
    type: Array,
    required: true,
  },
  selectedFolder: {
    type: String,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["select-folder", "close-sidebar", "add-folder"])

// State
const searchQuery = ref("")
const hoveredFolder = ref(null)

// Computed properties
const filteredFolders = computed(() => {
  if (!searchQuery.value.trim()) return props.folders
  return props.folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Methods
const selectFolder = (folderId) => {
  emit("select-folder", folderId)
}

const addFolder = () => {
  emit("add-folder")
}
</script>