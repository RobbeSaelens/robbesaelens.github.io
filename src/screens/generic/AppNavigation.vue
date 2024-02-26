<template>
  <div class="flex items-center justify-between">
    <router-link class="focus-visible:ring-2xl rounded-md outline-none tooltip" to="/">
      <a href="/" @click="closeMenu">
        <img
          class="hidden sm:block scale h-5 customFill"
          @mouseover="toggleTooltip"
          src="/Logo.svg"
          alt="Logo"
        />
        <img
          @mouseover="toggleTooltip2"
          src="/Fav.png"
          alt="Logo"
          class="scale h-5 customFill block sm:hidden"
        />
      </a>
    </router-link>

    <button
      @click="toggleNav"
      data-collapse-toggle="navbar-default"
      type="button"
      class="hamburger z-5000 rounded-lg p-2 text-sm text-teal-600 focus:outline-none focus:ring-2 focus:ring-gray-600 sm:hidden"
      aria-controls="navbar-default"
      aria-expanded="false"
    >
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
  </div>
  <div
    :class="showMenu ? 'inline-block' : 'hidden'"
    class="w-full items-center border-0 sm:block sm:w-auto slide-in"
    id="navbar-default"
  >
    <ul
      class="justify-end flex items-center rounded-lg pt-4 font-medium sm:mt-0 sm:flex-row sm:space-x-8 sm:space-y-0 sm:border-0 sm:text-sm"
    >
      <li :class="{ 'sm:active-link': $route.path === '/projects' }">
        <router-link
          class="active flex text-lg text-teal-700 sm:border-0 sm:p-0 dark:text-teal-500"
          to="/projects"
          @click="closeMenu"
        >
          Projects
        </router-link>
      </li>

      <li :class="{ 'sm:active-link ': $route.path === '/contact' }">
        <router-link
          class="active flex text-lg text-teal-700 sm:border-0 sm:p-0 dark:text-teal-500"
          to="/contact"
          @click="closeMenu"
        >
          About me
        </router-link>
      </li>
      <li
        class="hidden cursor-pointer text-teal-700 sm:border-0 sm:p-0 dark:text-teal-300 sm:block"
      >
        <Moon id="Moon" class="h-6 w-6" @click="toggleTheme" />
        <Sun id="Sun" class="h-6 w-6 hidden" @click="toggleTheme" />
      </li>
    </ul>
  </div>
</template>

<script>
import { ref } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'

export default {
  components: {
    Sun,
    Moon,
  },
  setup() {
    const showMenu = ref(false)

    const toggleNav = () => {
      showMenu.value = !showMenu.value
    }

    const closeMenu = () => {
      showMenu.value = false
    }

    const toggleTheme = () => {
      const Sun = document.getElementById('Sun')
      const Moon = document.getElementById('Moon')

      if (localStorage.theme === 'light') {
        localStorage.theme = 'dark'
        Sun.style.display = 'none'
        Moon.style.display = 'block'
        document.documentElement.classList.remove('dark')
      } else if (localStorage.theme === 'dark') {
        localStorage.theme = 'light'
        Moon.style.display = 'none'
        Sun.style.display = 'block'
        document.documentElement.classList.add('dark')
      }
    }

    const tooltipOptions = [
      'Coding Fun',
      'Dev Jokes',
      'Frontend!',
      'Backend!',
      'Roberto',
      'Bug Hugs',
      'JS Rocks',
      'CSS LOL',
      'API LOL',
      'HTML <3',
      'Node Fun',
      'Vue Rocks',
      'Gatsby Fun',
      'UI',
      'UX',
    ]

    const toggleTooltip = () => {
      const tooltip = document.querySelector('.tooltip')
      if (tooltip) {
        const randomIndex = Math.floor(Math.random() * tooltipOptions.length)
        const tooltipContent = tooltipOptions[randomIndex]
        tooltip.style.setProperty('--tooltip-content', `"${tooltipContent}"`)
      }
    }
    const toggleTooltip2 = () => {
      const tooltip = document.querySelector('.tooltip')
      if (tooltip) {
        // remove tooltip class
        tooltip.classList.remove('tooltip')
      }
    }

    return {
      showMenu,
      toggleNav,
      closeMenu,
      toggleTheme,
      toggleTooltip,
      toggleTooltip2,
    }
  },
}
</script>

<style>
.hamburger {
  background-color: rgba(0, 128, 128, 0.1);
}

@keyframes slideIn {
  0% {
    transform: translateX(2%);
  }
  50% {
    transform: translateX(-10%);
  }
  100% {
    transform: translateX(0);
  }
}

@media (max-width: 767px) {
  .slide-in {
    animation: slideIn 0.5s ease-in-out forwards;
  }
}

.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip::before {
  content: var(--tooltip-content, '');
  position: absolute;
  width: 80%;
  top: 120%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 128, 128, 0.35);
  color: white;
  font-weight: bold;
  text-align: center;
  padding: 0.3rem 0.5rem;
  border-radius: 0.4rem;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.5s ease-in-out, visibility 0.3s ease-in-out, transform 0.3s ease-in-out;
}

.tooltip:hover::before {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(5px);
}

.scale {
  transform: scale(1);
}

.scale:hover {
  transform: scale(1.1);
}

@media (min-width: 768px) {
  .scale {
    transition: transform 0.5s ease-in-out;
  }

  .scale:hover {
    transform: scale(1.05);
  }
}

.active {
  padding: 0.3rem 0.8rem;
}

.active:focus,
.active:active {
  border-radius: 5rem;
  background-color: rgba(0, 128, 128, 0.15);
  transition: background-color 0.5s ease-in-out;
}

.active:hover {
  border-radius: 5rem;
  background-color: rgba(0, 128, 128, 0.05);
  transition: background-color 0.5s ease-in-out;
}
</style>
