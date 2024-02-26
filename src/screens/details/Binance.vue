<template>
  <div class="pb-10 fade-out">
    <div class="mx-auto max-w-screen-xl pt-10">
      <div class="text-center">
        <h1 class="mx-5 mb-10 text-6xl font-bold text-teal-700 md:text-8xl dark:text-teal-300">
          Binance app
        </h1>
        <div
          class="justify-center pt-5 text-lg font-medium text-teal-500 flex space-y-0 space-x-5 md:space-x-8 dark:text-teal-100"
        >
          <p>Adobe XD</p>
          <p>LottieFiles</p>
          <p>Adobe AfterEffects</p>
        </div>
      </div>
      <div>
        <img
          class="w-90% scale md:w-300 shadow-3xl mx-auto my-10 rounded-lg md:block"
          src="/Mockup.jpg"
        />
      </div>
      <div>
        <div class="md:m-10 m-5 flex justify-between md:pt-10">
          <div class="md:mr-10 space-y-8">
            <div class="md:w-2/3">
              <h1 class="mb-10 text-5xl font-bold text-teal-800 dark:text-teal-300">
                Project Overview
              </h1>
              <h1 class="text-xl font-bold text-teal-800 dark:text-teal-100">About</h1>
              <p class="dark:text-gray">
                This is a schoolproject that i created in Adobe XD. I wanted to create a smartwatch
                app that could be used to watch your crypto. I used LottieFiles to implement the
                animations in Adobe XD and Adobe AfterEffects to create them.
              </p>
            </div>
            <div>
              <h1 class="text-xl font-bold text-teal-800 dark:text-teal-300">Languages</h1>
              <p class="font-medium text-teal-500">
                Adobe XD, LottieFiles, Adobe AfterEffects, Adobe Illustrator
              </p>
            </div>
            <div>
              <h1 class="text-xl font-bold text-teal-800 dark:text-teal-300">Tools</h1>
              <p class="dark:text-gray">Visual Studio Code, Azure Portal, Amazon AWS, Adobe XD</p>
            </div>
            <div
              class="mt-10 pt-10 hover:text-teal-800 text-teal-600 inline-block dark:hover:text-teal-300"
            >
              <router-link class="flex items-center" to="/projects">
                <ArrowRight class="animate-bouncer mr-2" />
                <p
                  class="font-medium text-teal-600 hover:text-teal-800 sm:text-lg dark:hover:text-teal-300"
                >
                  View other projects
                </p>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Briefcase, GraduationCap, ArrowRight } from 'lucide-vue-next'
export default {
  components: {
    Briefcase,
    GraduationCap,
    ArrowRight,
  },
  methods: {
    mailto() {
      window.location.href = 'mailto:robbe.saelens@telenet.be'
    },
  },
}
</script>

<style>
.scale {
  transition: transform 0.5s ease-in-out;
}

.scale:hover {
  transform: scale(1.02);
}

@media (min-width: 768px) {
  .scale {
    transition: transform 0.3s ease-in-out;
  }

  .scale:hover {
    transform: scale(1.02);
  }
}

.shadow-3xl {
  box-shadow: 0 0 25px 25px rgba(0, 0, 0, 0.1);
}
</style>
