<template>
  <div class="bg-green-600 border-t border-green-700 p-3">
    <div class="flex items-center justify-between">
      <div class="flex-1 overflow-x-auto">
        <div class="flex space-x-2">
          <div 
            v-for="(item, index) in queue" 
            :key="`${item.id}-${index}`"
            class="flex-shrink-0 relative group"
          >
            <div class="w-12 h-12 bg-white rounded-md flex items-center justify-center border border-green-600">
              <img 
                :src="`https://unavatar.io/${item.label}?ttl=1h`" 
                :alt="item.label" 
                class="object-contain h-10 w-10"
              />
            </div>
            <button 
              @click="$emit('remove-from-queue', index)" 
              class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              :aria-label="`Remove ${item.label} from queue`"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="flex-shrink-0 ml-4">
        <button 
          @click="$emit('play-queue')" 
          class="bg-white text-green-600 px-4 py-2 rounded-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
          :disabled="queue.length === 0"
          aria-label="Play all pictograms in queue"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Play All</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue"

const props = defineProps({
  queue: {
    type: Array,
    required: true,
  },
})

defineEmits(["play-queue", "remove-from-queue"])
</script>

<style scoped>
/* Add any additional styles if needed */
</style>
