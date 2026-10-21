<script setup lang="js">
</script>

<template>
  <div>
    <div class="navbar bg-primary text-primary-content p-2">
      <div class="flex-1 pl-2">
        <RouterLink
          to="/"
          class="flex gap-2 items-center"
        >
          <img
            src="../../../public/icon/128.png"
            alt="logo"
            class="h-8 w-auto"
          />
          <div class="text-base font-semibold">Epubespiar</div>
        </RouterLink>
      </div>
    </div>

    <div class="p-4 prose">
      <RouterView />
    </div>

    <footer
      class="flex justify-between bg-base-200 text-base-content items-center p-2 text-xs"
    >
      <aside>
        <p>Copyright © {{ new Date().getFullYear() }} <span class="text-base font-semibold">Epubespiar</span> - All rights reserved</p>
      </aside>
    </footer>
  </div>
</template>

<style scoped></style>
