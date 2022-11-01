<template>
  <button
    @click="toggleNav"
    data-collapse-toggle="navbar-default"
    type="button"
    class="
      absolute
      top-5
      right-6
      p-2
      text-sm
      rounded-lg
      sm:hidden
      focus:outline-none focus:ring-2
      text-teal-600
      focus:ring-gray-600
    "
    aria-controls="navbar-default"
    aria-expanded="false"
  >
    <span class="sr-only">Open main menu</span>
    <svg
      class="w-6 h-6"
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
      class="
        flex flex-col
        p-4
        mt-4
        rounded-lg
        border border-teal-800
        sm:flex-row sm:space-x-15 sm:mt-0 sm:text-sm sm:font-bold
        font-medium
        sm:border-0
      "
    >
      <li class="text-white">
        <router-link
          class="
            text-xl
            flex
            py-2
            pr-5
            pl-3
            rounded
            hover:bg-teal-800 hover:bg-opacity-35
            sm:hover:bg-transparent sm:border-0 sm:hover:text-teal-800 sm:p-0
          "
          to="/"
          exact-active-class="text-teal-800"
        >
          Home</router-link
        >
      </li>

      <li class="text-white">
        <router-link
          class="
            text-xl
            flex
            py-2
            pr-5
            pl-3
            rounded
            hover:bg-teal-800 hover:bg-opacity-35
            sm:hover:bg-transparent sm:border-0 sm:hover:text-teal-800 sm:p-0
          "
          active-class="text-teal-800"
          to="/projects"
        >
          Projects</router-link
        >
      </li>

      <li class="text-white">
        <router-link
          class="
            text-xl
            flex
            py-2
            pr-5
            pl-3
            rounded
            hover:bg-teal-800 hover:bg-opacity-35
            sm:hover:bg-transparent sm:border-0 sm:hover:text-teal-800 sm:p-0
          "
          active-class="text-teal-800"
          to="/contact"
        >
          Contact</router-link
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