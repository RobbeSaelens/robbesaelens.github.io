<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <main class="flex flex-1 flex-col min-h-0">
      <router-view> </router-view>
    </main>
    <AppFooter />
  </div>
</template>

<script lang="ts">
import AppFooter from '../../screens/generic/AppFooter.vue'
import AppHeader from '../../screens/generic/AppHeader.vue'

export default {
  components: {
    AppFooter,
    AppHeader,
  },
}
</script>
