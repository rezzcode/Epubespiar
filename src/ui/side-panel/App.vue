<script setup lang="js">
import NotificationToast from '../../components/NotificationToast.vue'
import useNotification from '../../composables/useNotification'
import AppFooter from '../../components/AppFooter.vue'
import AppHeader from '../../components/AppHeader.vue'

const { addNotification } = useNotification()
</script>

<template>
  <div>
    <AppHeader />
    <NotificationToast />

    <div class="p-4 prose">
      <RouterView />
    </div>

    <AppFooter />
  </div>
</template>

<style scoped></style>
