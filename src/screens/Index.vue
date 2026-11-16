<template>
  <header class="home fade-out flex flex-1 items-center">
    <Profile />
  </header>
</template>

<script>
import Profile from '../components/Profile.vue'

export default {
  components: {
    Profile,
  },
}
</script>

<style scoped>
/* Portrait tablets: the hero at the top, not floating in the middle of a tall screen */
@media (min-width: 640px) and (orientation: portrait) {
  .home {
    align-items: flex-start;
  }
}
</style>
