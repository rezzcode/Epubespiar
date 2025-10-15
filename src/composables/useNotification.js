import { ref, onUnmounted } from 'vue'

const notifications = ref([])
const timeouts = new Map()

const useNotification = (() => {
  const addNotification = ({ message, type = 'info', timeout = 5000 }) => {
    const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    notifications.value.push({ id, message, type })

    if (timeout) {
      const timeoutId = setTimeout(() => {
        removeNotification(id)
      }, timeout)

      timeouts.set(id, timeoutId)
    }
  }

  const removeNotification = (id) => {
    notifications.value = notifications.value.filter(n => n.id !== id)

    if (timeouts.has(id)) {
      clearTimeout(timeouts.get(id))
      timeouts.delete(id)
    }
  }

  onUnmounted(() => {
    timeouts.forEach(clearTimeout)
    timeouts.clear()
  })

  return () => ({
    notifications,
    addNotification,
    removeNotification
  })
})()

export default useNotification