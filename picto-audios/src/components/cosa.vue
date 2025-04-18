<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(["increment", "decrement"])

const increment = () => {
  emit("increment")
}

const decrement = () => {
  emit("decrement")
}
</script>
