<template>
  <div class="fade-out mx-auto my-auto max-w-screen-2xl px-6">
    <div class="sm:space-x-15 mr-5% mt-10% flex items-center justify-between dark:text-teal-300">
      <div class="hidden text-teal-700 sm:block">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.instagram.com/robbe.saelens/"
          aria-label="Follow me on Instagram"
        >
          <Instagram class="mb-5 cursor-pointer hover:text-teal-900 dark:hover:text-teal-500" />
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.facebook.com/profile.php?id=100006223099352"
          aria-label="Connect on Facebook"
        >
          <Facebook class="mb-5 cursor-pointer hover:text-teal-900 dark:hover:text-teal-500" />
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/"
          aria-label="Connect on LinkedIn"
        >
          <Linkedin class="mb-5 cursor-pointer hover:text-teal-900 dark:hover:text-teal-500" />
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/RobbeSaelens"
          aria-label="View my GitHub profile"
        >
          <Github class="mb-5 cursor-pointer hover:text-teal-900 dark:hover:text-teal-500" />
        </a>
      </div>
      <div class="typewriter space-y-8">
        <h1 class="mb-5 text-5xl font-bold text-teal-800 dark:text-teal-300 lg:text-7xl">
          Robbe Saelens
        </h1>
        <div class="dark:text-gray flex items-center font-medium text-teal-600">
          <hr class="h-2px dark:bg-gray mr-3 hidden w-10 border-0 bg-teal-600 lg:block" />
          <h2 class="text-3xl font-medium">Next Web Developer</h2>
        </div>
        <img
          class="rounded-2 object-cover shadow sm:hidden"
          src="/pf2.jpg"
          alt="Robbe Saelens"
          loading="lazy"
        />
        <div class="max-w-lg space-y-5">
          <p class="text-lg leading-relaxed text-teal-800 dark:text-white">
            I'm a full stack web developer based in Gilwe (Geluwe), I like making
            <span class="italic">"cool stuff"</span> and discovering new things.
          </p>
          <div class="space-y-3 border-l-2 border-teal-300 pl-5 dark:border-teal-700">
            <div class="flex items-center gap-2 sm:text-lg">
              <Briefcase class="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span class="text-teal-800 dark:text-white">
                @<a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www.dynamate.be/"
                  class="font-semibold transition-colors hover:text-teal-600 dark:hover:text-teal-400"
                  >Dynamate</a
                >
                as Drupal backend developer.
              </span>
            </div>
            <div class="flex items-center gap-2 sm:text-lg">
              <GraduationCap class="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span class="text-teal-800 dark:text-white">
                Bachelor's degree in
                <a
                  href="https://www.howest.be/nl/opleidingen/bachelor/multimedia-en-creatieve-technologie"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-semibold transition-colors hover:text-teal-600 dark:hover:text-teal-400"
                  >MCT</a
                >
              </span>
            </div>
          </div>
        </div>

        <div>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/message"
            class="relative inline-flex items-center overflow-hidden rounded-2xl border-0 bg-teal-500 py-5 px-6 text-xl font-medium text-teal-900 transition-colors duration-500 ease-in-out hover:bg-teal-900 hover:text-white hover:shadow-lg dark:bg-teal-800 dark:text-white dark:hover:bg-teal-700 md:py-5 md:px-8"
          >
            Say Hello
            <MessageCircle class="ml-2" />
          </a>

          <div
            class="mt-10 mb-10 flex cursor-pointer items-center space-x-2 text-teal-600 hover:text-teal-800 dark:text-teal-500 dark:hover:text-teal-300 sm:mt-20 sm:mb-0"
          >
            <router-link class="flex items-center" to="/projects">
              <ArrowRight class="animate-bouncer mr-2" />
              <span
                class="font-medium text-teal-600 hover:text-teal-800 dark:text-teal-500 dark:hover:text-teal-300 sm:text-lg"
              >
                Go to my projects
              </span>
            </router-link>
          </div>
        </div>
      </div>
      <div>
        <img
          class="animate-breathe lg:h-100 lg:w-100 h-50 w-50 dark:animate-spin-dark hidden rounded-full object-cover shadow md:block"
          src="/pf2.jpg"
          alt="Robbe Saelens"
          loading="lazy"
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
  GraduationCap,
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
    GraduationCap,
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
