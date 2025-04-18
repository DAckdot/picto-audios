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
              src="../assets/picto_ex.png" 
              alt="Pictogram" 
              loading="lazy"
              class="object-contain h-full w-full p-2"
            />
          </div>
          <div class="p-2 text-center">
            <p class="text-sm font-medium text-green-600">{{ pictogram.label }}</p>
          </div>
        </button>
        <button 
          @click="$emit('add-to-queue', pictogram)" 
          class="w-full py-1 px-2 bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors duration-200 focus:outline-none flex items-center justify-center space-x-2"
          :aria-label="`Agregar ${pictogram.label} a la lista`"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 4v16m8-8H4"/>
          </svg>
          <span>Agregar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
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
