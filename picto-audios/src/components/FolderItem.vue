<template>
  <div 
    class="folder-item flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200"
    :class="{
      'bg-green-500 text-white': isSelected,
      'hover:bg-gray-200': !isSelected,
    }"
    @click="selectFolder"
  >
    <div class="icon w-8 h-8 flex items-center justify-center bg-gray-300 rounded-md mr-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path d="M3 7h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
        <path d="M3 7l3-3h12l3 3" />
      </svg>
    </div>
    <span class="folder-name font-medium">{{ folder.name }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  folder: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["select-folder"])

const selectFolder = () => {
  emit("select-folder", props.folder.id)
}
</script>

<style scoped>
.folder-item {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
