<template>
  <div class="pictogram-card" @click="handleClick">
    <img src="../assets/picto_ex.png" alt="Pictogram" />
    <p>{{ pictogram.name }}</p>
    <button class="bg-green-400" @click.stop="handleAddToQueue">Add to Queue</button>
  </div>
</template>

<script setup>
const props = defineProps({
  pictogram: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(["click", "add-to-queue"])

const handleClick = () => {
  emit("click", props.pictogram)
}

const handleAddToQueue = () => {
  emit("add-to-queue", props.pictogram)
}
</script>

<style scoped>
.pictogram-card {
  border: 1px solid #ccc;
  padding: 16px;
  text-align: center;
}
button {
  margin-top: 8px;
}
</style>
