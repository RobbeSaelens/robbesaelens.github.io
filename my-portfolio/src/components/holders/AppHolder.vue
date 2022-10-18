<template>
  <div class="bg-neutral-900 h-screen">
    <AppHeader />
    <router-view class="overflow y-auto"></router-view>
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