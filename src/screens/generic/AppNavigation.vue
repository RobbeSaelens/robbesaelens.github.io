<template>
  <button
    @click="toggleNav"
    data-collapse-toggle="navbar-default"
    type="button"
    class="absolute top-5 right-6 rounded-lg p-2 text-sm text-teal-600 focus:outline-none focus:ring-2 focus:ring-gray-600 sm:hidden"
    aria-controls="navbar-default"
    aria-expanded="false"
  >
    <span class="sr-only">Open main menu</span>
    <svg
      class="h-6 w-6"
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clip-rule="evenodd"
      ></path>
    </svg>
  </button>
  <div
    :class="showMenu ? 'block' : 'hidden'"
    class="w-full items-center border-0 sm:block sm:w-auto"
    id="navbar-default"
  >
    <ul
      class="mt-4 flex flex-col items-center space-y-2 rounded-lg pt-4 font-medium sm:mt-0 sm:flex-row sm:space-x-8 sm:space-y-0 sm:border-0 sm:text-sm"
    >
      <li :class="{ 'sm:active-link': $route.path === '/projects' }">
        <router-link
          class="flex text-lg text-teal-700 hover:text-teal-900 sm:border-0 sm:p-0"
          active-class="text-teal-900 active-link"
          to="/projects"
          @click="closeMenu"
        >
          Projects</router-link
        >
      </li>

      <li :class="{ 'sm:active-link ': $route.path === '/contact' }">
        <router-link
          class="flex text-lg text-teal-700 hover:text-teal-900 sm:border-0 sm:p-0"
          active-class="text-teal-900 active-link"
          to="/contact"
          @click="closeMenu"
        >
          About me</router-link
        >
      </li>
      <li class="hidden cursor-pointer pl-10 text-teal-700 hover:text-teal-900 sm:block">
        <sunMedium />
      </li>
    </ul>
  </div>
</template>

<script>
import { ref } from 'vue'
import { SunMedium } from 'lucide-vue-next'
export default {
  components: {
    SunMedium,
  },
  setup() {
    // toggleNav and showMenu
    const showMenu = ref(false)
    const toggleNav = () => {
      showMenu.value = !showMenu.value
    }
    // close the menu when a link is clicked
    const closeMenu = () => {
      showMenu.value = false
    }

    return {
      showMenu,
      toggleNav,
      closeMenu,
      SunMedium,
    }
  },
}
</script>
<style scoped>
.active-link {
  border-bottom: 2px solid #319795;
  /* text color */
  color: #184948;
}
</style>
