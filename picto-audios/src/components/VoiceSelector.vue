<template>
  <select 
    :value="modelValue" 
    @input="$emit('update:modelValue', $event.target.value)" 
    class="p-2 border rounded bg-white text-gray-700"
  >
    <option v-for="(voice, index) in voices" :key="index" :value="voice">
      {{ voice.name }} ({{ voice.lang }})
    </option>
  </select>
</template>

<script setup>
const props = defineProps({
  voices: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: Object,
    default: null, // Allow null as the default value
  },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<style scoped>
/* Add any additional styles if needed */
</style>
