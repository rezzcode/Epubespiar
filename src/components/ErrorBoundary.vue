<template>
  <div v-if="error" class="error-boundary p-4 bg-error text-error-content rounded-lg">
    <h3 class="text-lg font-bold mb-2">Something went wrong</h3>
    <p class="mb-4">{{ error.message }}</p>
    <button 
      @click="resetError" 
      class="btn btn-outline btn-sm"
    >
      Try Again
    </button>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const props = defineProps({
  onError: {
    type: Function,
    default: null
  }
})

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  error.value = err
  if (props.onError) {
    props.onError(err, instance, info)
  }
  return false // prevent error from propagating
})

const resetError = () => {
  error.value = null
}
</script>
