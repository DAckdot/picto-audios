<template>
  <aside 
    :class="[
      'bg-primary w-64 border-r border-primary-dark transition-all duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      'fixed md:static top-0 left-0 h-full z-40 md:z-0'
    ]"
  >
    <div class="p-4 border-b border-primary-dark flex justify-between items-center">
      <button 
        @click="toggleSearch" 
        class="p-2 rounded-full hover:bg-primary-light"
        aria-label="Toggle search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>
    <div v-if="searchOpen" class="p-4 border-b border-primary-dark">
      <input 
        type="text" 
        placeholder="Search folders..." 
        v-model="searchQuery"
        class="w-full px-3 py-2 border border-primary-light rounded-full bg-secondary text-primary focus:ring-2 focus:ring-primary focus:outline-none"
      />
    </div>
    <nav class="p-4 overflow-y-auto h-full">
      <h2 class="text-sm font-semibold text-secondary uppercase tracking-wider mb-2">Folders</h2>
      <ul class="space-y-1">
        <li 
          v-for="folder in filteredFolders" 
          :key="folder.id"
        >
          <button 
            @click="$emit('select-folder', folder.id)" 
            :class="[
              'w-full text-left px-3 py-2 rounded-full flex items-center',
              selectedFolder === folder.id 
                ? 'bg-secondary text-primary' 
                : 'hover:bg-primary-light text-secondary'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" :class="selectedFolder === folder.id ? 'text-primary-dark' : 'text-secondary'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M3 7h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
              <path d="M3 7l3-3h12l3 3" />
            </svg>
            {{ folder.name }}
          </button>
        </li>
      </ul>
    </nav>
    <button 
      @click="$emit('close-sidebar')" 
      class="md:hidden absolute top-4 right-4 p-2 rounded-full hover:bg-primary-light"
      aria-label="Close sidebar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
    </button>
  </aside>
</template>

<script setup>
import { ref, computed } from "vue"

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

defineEmits(["select-folder", "close-sidebar"])

// State
const searchOpen = ref(false)
const searchQuery = ref("")

// Methods
const toggleSearch = () => {
  searchOpen.value = !searchOpen.value
}

// Computed properties
const filteredFolders = computed(() => {
  if (!searchQuery.value.trim()) return props.folders
  return props.folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})
</script>

<style scoped>
/* Add any additional styles if needed */
</style>