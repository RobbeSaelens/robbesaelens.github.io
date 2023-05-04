<template>
  <div>
    <splash-screen class="bg-image h-screen overflow-hidden" v-if="isLoading" />
    <div v-else class="fade-out">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import SplashScreen from './components/splashScreen.vue'

export default {
  name: 'App',
  components: {
    SplashScreen,
  },
  data() {
    return {
      isLoading: true,
    }
  },
  mounted() {
    const MIN_LOADING_TIME = 2000 // Minimum loading time in milliseconds
    const startTime = Date.now()

    // Simulate a 2 second loading delay
    setTimeout(() => {
      const elapsedTime = Date.now() - startTime
      if (elapsedTime < MIN_LOADING_TIME) {
        // If loading took less than 2 seconds, wait for the remaining time
        setTimeout(() => {
          this.isLoading = false
        }, MIN_LOADING_TIME - elapsedTime)
      } else {
        // If loading took longer than 2 seconds, let splash screen fade out with an animation
        this.isLoading = false
      }
    }, 2000)
  },
}
</script>

<style>
.bg-image {
  background-image: url('/bg.svg');
  background-size: cover;
}
.fade-out {
  animation: fadeIn 1s ease-in-out;
}
</style>
