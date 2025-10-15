import { ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { useBrowserLocalStorage } from './useBrowserStorage'

export function useTheme() {
  const isLoading = ref(true)
  const { data: colorSchema } = useBrowserLocalStorage("mode", "auto")

  // Get initial theme from localStorage to prevent flash
  const initialTheme = localStorage.getItem('vueuse-color-scheme') || 'auto'
  document.documentElement.setAttribute('data-theme', initialTheme)

  const isDark = useDark({
    selector: 'html',
    attribute: 'data-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'vueuse-color-scheme',
    onChanged: (dark) => {
      colorSchema.value = dark ? 'dark' : 'light'
      isLoading.value = false
    },
  })

  const toggleDark = useToggle(isDark)

  return {
    isDark,
    toggleDark,
    isLoading,
    colorSchema
  }
}
