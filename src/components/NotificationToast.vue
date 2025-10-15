<template>
  <div class="notification-container fixed bottom-4 right-4 z-50">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'notification p-4 mb-2 rounded-lg shadow-lg max-w-sm',
          `bg-${notification.type} text-${notification.type}-content`
        ]"
      >
        <div class="flex items-center justify-between">
          <span>{{ notification.message }}</span>
          <button
            @click="removeNotification(notification.id)"
            class="ml-4 opacity-75 hover:opacity-100"
          >
            ×
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { TransitionGroup } from 'vue'
import useNotification from '../composables/useNotification'

const { notifications, removeNotification } = useNotification()
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
