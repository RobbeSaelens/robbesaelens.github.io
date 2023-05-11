<template>
  <div class="pb-30 fade-out h-screen overflow-y-auto">
    <div class="mx-auto max-w-screen-xl pt-10">
      <div class="text-center">
        <h1 class="mx-5 mb-10 text-6xl font-bold text-teal-700 md:text-8xl">BikeRental Robbe</h1>
        <div
          class="justify-center space-y-5 pt-5 text-lg font-medium text-teal-500 md:flex md:space-y-0 md:space-x-8"
        >
          <p>Vue.js</p>
          <p>Typescript</p>
          <p>Firebase</p>
          <p>NestJs</p>
          <p>GraphQL</p>
          <p>MongoDB</p>
        </div>
      </div>
      <div>
        <img
          class="scale w-300 shadow-3xl mx-auto my-10 hidden rounded-lg md:block"
          src="/BikeRental.jpg"
        />
        <img
          class="scale h-120 my-5 mx-auto block md:hidden"
          src="/AzureIphone.png"
          alt="Iphone mockup"
        />
      </div>
      <div>
        <div class="m-10 flex justify-between pt-10">
          <div class="mr-10 space-y-8">
            <div class="md:w-2/3">
              <h1 class="mb-10 text-5xl font-bold text-teal-800">Project Overview</h1>
              <h1 class="text-xl font-bold text-teal-800">About</h1>
              <p>
                This is a schoolproject that i created with Achille Dupont. In the PWA you can rent
                a bike and see the location of the bike. You can also see the location of the bike
                on the map. There is also a admin panel where you can add bikes and see the status
                of the bikes.
              </p>
            </div>
            <div>
              <h1 class="text-xl font-bold text-teal-800">Languages</h1>
              <p class="font-medium text-teal-500">
                Vue.js, Typescript, Javascript, NestJs, GraphQL, Apollo, TailwindCSS
              </p>
            </div>
            <div>
              <h1 class="text-xl font-bold text-teal-800">Tools</h1>
              <p>Visual Studio Code, Mapbox, Adobe XD, MongoDB, Firebase</p>
            </div>
            <div class="mt-10 pt-10 hover:text-teal-600">
              <router-link class="flex items-center" to="/projects">
                <ArrowRight class="animate-bouncer mr-2" />
                <p class="font-medium text-teal-800 hover:text-teal-600 sm:text-lg">
                  View other projects
                </p>
              </router-link>
            </div>
          </div>
          <div>
            <img class="scale w-150 hidden md:block" src="/AzureIphone.png" alt="Iphone mockup" />
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
