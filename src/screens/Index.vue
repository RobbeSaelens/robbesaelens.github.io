<template>
  <div>
    <div class="mx-auto max-w-screen-2xl">
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
