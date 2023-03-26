<template>
  <div class="mx-auto my-auto max-w-screen-2xl px-6">
    <div class="space-x-15 mr-5% mt-10% flex items-center justify-between">
      <div class="text-teal-800">
        <a target="_blank" href="https://www.instagram.com/robbe.saelens/">
          <Instagram class="mb-5 cursor-pointer" />
        </a>
        <a target="_blank" href="https://www.facebook.com/profile.php?id=100006223099352">
          <Facebook class="mb-5 cursor-pointer"
        /></a>
        <a target="_blank" href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/">
          <Linkedin class="mb-5 cursor-pointer"
        /></a>
        <a target="_blank" href="https://github.com/RobbeSaelens">
          <Github class="mb-5 cursor-pointer"
        /></a>
      </div>
      <div class="space-y-8">
        <h1 class="text-dark-500 mb-5 text-5xl font-bold lg:text-7xl">
          Robbe Saelens <span class="animate-waving-hand hidden md:inline-block">👋</span>
        </h1>
        <div class="flex items-center font-medium text-teal-800">
          <hr class="h-1px mr-5 hidden w-20 border-0 bg-teal-900 lg:block" />
          <h1 class="text-3xl">Next Web Developer</h1>
        </div>
        <div>
          <p class="max-w-lg text-lg text-teal-800">
            I'm a full stack web developer based in Kortemark city, and i'm very passionate and
            dedicated to my work.
          </p>
        </div>
        <div>
          <button
            class="relative overflow-hidden rounded-2xl bg-teal-500 py-5 px-6 text-xl font-medium text-teal-900 transition-colors duration-500 ease-in-out hover:border-teal-900 hover:bg-teal-900 hover:text-white hover:shadow-lg md:py-5 md:px-8"
          >
            <span class="bg-gray absolute top-0 left-0 z-10 h-full w-full opacity-0"></span>
            <span class="relative z-20 flex items-center"
              >Say Hello <MessageCircle class="ml-2"
            /></span>
          </button>

          <div class="mt-20 flex cursor-pointer items-center space-x-2">
            <a class="flex items-center" href="/Projects">
              <ArrowRight class="animate-bouncer mr-2" />
              <p class="text-lg font-medium text-black">Go to my projects</p>
            </a>
          </div>
        </div>
      </div>
      <div>
        <img
          class="lg:h-100 lg:w-100 h-50 w-50 hidden transform rounded-full object-cover transition duration-500 ease-in-out hover:-translate-y-1 hover:scale-110 md:block"
          src="/pf.jpg"
          alt="Robbe Saelens"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import {
  Verified,
  Album,
  Instagram,
  Linkedin,
  Facebook,
  Github,
  MessageCircle,
  Mouse,
  ArrowRight,
} from 'lucide-vue-next'
export default {
  components: {
    Verified,
    Album,
    Instagram,
    Linkedin,
    Facebook,
    Github,
    Mouse,
    MessageCircle,
    ArrowRight,
  },
}
</script>

<style>
.animate-bouncer {
  animation: bouncer 2s infinite;
}

@keyframes bouncer {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateX(0);
  }
  40% {
    transform: translateX(6px);
  }
  60% {
    transform: translateX(3px);
  }
}
</style>
