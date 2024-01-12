<template>
  <div class="fade-out mx-auto my-auto max-w-screen-2xl overflow-hidden px-6">
    <div class="space-x-15 mr-5% mt-10% flex items-center justify-between dark:text-teal-300">
      <div class="text-teal-800">
        <a target="_blank" href="https://www.instagram.com/robbe.saelens/">
          <Instagram class="mb-5 cursor-pointer hover:fill-teal-300" />
        </a>
        <a target="_blank" href="https://www.facebook.com/profile.php?id=100006223099352">
          <Facebook class="mb-5 cursor-pointer hover:fill-teal-300" />
        </a>
        <a target="_blank" href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/">
          <Linkedin class="mb-5 cursor-pointer hover:fill-teal-300" />
        </a>
        <a target="_blank" href="https://github.com/RobbeSaelens">
          <Github class="mb-5 cursor-pointer hover:fill-teal-300" />
        </a>
      </div>
      <div class="typewriter space-y-8">
        <h1 class="mb-5 text-5xl font-bold text-teal-800 dark:text-teal-300 lg:text-7xl">
          Robbe Saelens
        </h1>
        <div class="flex items-center font-medium text-teal-600 dark:text-gray">
          <hr class="h-2px mr-3 hidden w-10 border-0 bg-teal-600 lg:block dark:bg-gray" />
          <h2 class="text-3xl font-medium">Next Web Developer</h2>
        </div>
        <div>
          <p class="max-w-lg text-lg text-teal-800 dark:text-white mb-3">
            I'm a full stack web developer based in Kortemark city, I like making
            <span class="italic">"cool stuff"</span> and discovering new things.
          </p>
          <strong class="max-w-lg text-lg dark:text-white">
            <Briefcase class="mr-1 inline-block text-teal-800" />
            Working @
            <a target="blank" href="https://www.yourmindourwork.be/" class="hover:text-teal-600"
              >YMOW</a
            >
            as a PHP developer.
          </strong>
        </div>

        <div>
          <button
            class="relative overflow-hidden rounded-2xl border-0 bg-teal-500 dark:bg-teal-800 py-5 px-6 text-xl font-medium text-teal-900 dark:text-white transition-colors duration-500 ease-in-out hover:bg-teal-900 hover:text-white hover:shadow-lg md:py-5 md:px-8"
          >
            <a target="_blank" href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/message">
              <span class="bg-gray absolute top-0 left-0 z-10 h-full w-full opacity-0"></span>
              <span class="relative z-20 flex items-center"
                >Say Hello <MessageCircle class="ml-2"
              /></span>
            </a>
          </button>

          <div
            class="mt-20 flex cursor-pointer items-center space-x-2 text-teal-600 dark:text-teal-300 hover:text-teal-800"
          >
            <router-link class="flex items-center" to="/projects">
              <ArrowRight class="animate-bouncer mr-2" />
              <p class="font-medium text-teal-600 hover:text-teal-800 sm:text-lg">
                Go to my projects
              </p>
            </router-link>
          </div>
        </div>
      </div>
      <div>
        <img
          class="animate-breathe lg:h-100 lg:w-100 h-50 w-50 hidden rounded-full object-cover shadow md:block dark:animate-spin-dark"
          src="/pf2.jpg"
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
  Briefcase,
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
    Briefcase,
  },
}
</script>

<style scoped>
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

.animate-breathe {
  animation: breathe 2s infinite;
  border-radius: rounded-full;
}

@keyframes breathe {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
