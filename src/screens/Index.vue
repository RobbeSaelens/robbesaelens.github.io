<template>
  <div>
    <div class="max-w-screen-2xl mx-auto">
      <Profile class="animate__animated animate__backInDown" />
    </div>
  </div>
</template>

<script>
import Profile from '../components/Profile.vue'
import 'animate.css'

export default {
  components: {
    Profile,
  },
}
</script>
