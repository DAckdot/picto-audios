<template>
  <div class="p-4">
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div 
        v-for="pictogram in pictograms" 
        :key="pictogram.id"
        class="flex flex-col items-center bg-white rounded-lg border border-green-600 overflow-hidden hover:shadow-lg transition-shadow duration-200 focus-within:ring-2 focus-within:ring-green-500"
      >
        <button 
          @click="$emit('play-pictogram', pictogram)" 
          class="w-full p-2 focus:outline-none"
          :aria-label="`Play ${pictogram.label} sound`"
        >
          <div class="aspect-square bg-green-100 flex items-center justify-center overflow-hidden">
            <img 
              :src="`https://unavatar.io/${pictogram.label}?ttl=1h`" 
              :alt="pictogram.label" 
              class="object-contain h-full w-full p-2"
            />
          </div>
          <div class="p-2 text-center">
            <p class="text-sm font-medium text-green-600">{{ pictogram.label }}</p>
          </div>
        </button>
        <button 
          @click="$emit('add-to-queue', pictogram)" 
          class="w-full py-1 px-2 bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors duration-200 focus:outline-none"
          :aria-label="`Add ${pictogram.label} to queue`"
        >
          Add to Queue
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue"

const props = defineProps({
  pictograms: {
    type: Array,
    required: true,
  },
})

defineEmits(["play-pictogram", "add-to-queue"])
</script>

<style scoped>
/* Add any additional styles if needed */
</style>
