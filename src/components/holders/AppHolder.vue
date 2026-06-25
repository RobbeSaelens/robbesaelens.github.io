<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <main class="flex flex-1 flex-col min-h-0">
      <router-view> </router-view>
    </main>
    <ChatBot />
    <AppFooter />
  </div>
</template>

<script lang="ts">
import AppFooter from '../../screens/generic/AppFooter.vue'
import AppHeader from '../../screens/generic/AppHeader.vue'
import ChatBot from '../ChatBot.vue'

export default {
  components: {
    AppFooter,
    AppHeader,
    ChatBot,
  },
}
</script>
