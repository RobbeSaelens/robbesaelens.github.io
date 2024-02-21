<template>
  <div class="pb-30 fade-out h-screen overflow-y-auto">
    <div class="mx-auto max-w-screen-xl pt-10">
      <div class="text-center">
        <h1 class="mx-5 mb-10 text-6xl font-bold text-teal-700 md:text-8xl dark:text-teal-300">
          Vital Cities
        </h1>
        <div
          class="justify-center sm:px-2 pt-5 text-lg font-medium text-teal-500 flex flex-wrap space-y-0 md:space-x-8 dark:text-teal-100 mx-auto"
        >
          <div class="mr-5">
            <p>Gatsby</p>
          </div>
          <div class="mr-5">
            <p>Typescript</p>
          </div>
          <div class="mr-5">
            <p>Netlify</p>
          </div>
          <div class="mr-5">
            <p>LottieFiles</p>
          </div>
          <div>
            <p>After Effects</p>
          </div>
        </div>
      </div>
      <div>
        <img
          class="w-90% scale md:w-full mx-auto my-10 rounded-lg md:block"
          src="/VitalCitiesMockup.png"
        />
      </div>
      <div>
        <div class="md:m-10 m-5 flex justify-between">
          <div class="md:mr-10 space-y-8">
            <div class="md:w-2/3">
              <h1 class="mb-10 text-5xl font-bold text-teal-800 dark:text-teal-300">
                Project Overview
              </h1>
              <h1 class="text-xl font-bold text-teal-800 dark:text-teal-300">About</h1>
              <p class="dark:text-gray">
                This is a group project that i created for school. As a group we had to create a
                website for Vital Cities. Vital Cities is a company that helps cities to become more
                sustainable. We made the website very interactive and we used a lot of animations.
              </p>
            </div>
            <div>
              <h1 class="text-xl font-bold text-teal-800 dark:text-teal-300">Languages</h1>
              <p class="font-medium text-teal-500">Gatsby, Typescript, css</p>
            </div>
            <div>
              <h1 class="text-xl font-bold text-teal-800 dark:text-teal-300">Tools</h1>
              <p class="dark:text-gray">
                Visual Studio Code, Gatsby, Adobe After Effects, Adobe XD, LottieFiles
              </p>
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
</style>
