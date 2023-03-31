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
  <div :class="showMenu ? 'block' : 'hidden'" class="w-full sm:block sm:w-auto" id="navbar-default">
    <ul
      class="sm:space-x-15 mt-4 flex flex-col rounded-lg border border-teal-800 p-4 font-bold sm:mt-0 sm:flex-row sm:border-0 sm:text-sm"
    >
      <li :class="{ 'active-link text-teal-800': $route.path === '/projects' }">
        <router-link
          class="hover:bg-opacity-35 flex rounded py-2 pr-5 pl-3 text-xl text-teal-800 hover:bg-teal-800 sm:border-0 sm:p-0 sm:hover:bg-transparent sm:hover:text-teal-900"
          active-class=""
          to="/projects"
        >
          Projects</router-link
        >
      </li>

      <li :class="{ 'active-link text-teal-800': $route.path === '/contact' }">
        <router-link
          class="hover:bg-opacity-35 flex rounded py-2 pr-5 pl-3 text-xl text-teal-800 hover:bg-teal-800 sm:border-0 sm:p-0 sm:hover:bg-transparent sm:hover:text-teal-900"
          active-class="text-teal-800"
          to="/contact"
        >
          About me</router-link
        >
      </li>
    </ul>
  </div>
</template>

<script>
import { ref } from 'vue'
export default {
  setup() {
    let showMenu = ref(false)
    const toggleNav = () => (showMenu.value = !showMenu.value)
    return {
      showMenu,
      toggleNav,
    }
  },
}
</script>

<style scoped>
/* Add an underline to the active link */
li.active-link {
  position: relative;
}

li.active-link::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: 6;
  background-color: teal;
  animation: underline 0.5s forwards;
}

/* Define the underline animation */
@keyframes underline {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
</style>
