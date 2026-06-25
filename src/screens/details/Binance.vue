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
          alt="Binance cryptocurrency watch smartwatch app mockup"
          loading="lazy"
        />
      </div>
      <!-- Project Overview Section -->
      <div class="md:mx-10 mx-5 md:pt-10">
        <!-- Section Header -->
        <div class="mb-10">
          <h2 class="text-4xl md:text-5xl font-bold text-teal-800 dark:text-teal-300 mb-3">
            Project Overview
          </h2>
        </div>

        <!-- About -->
        <div class="flex flex-col md:flex-row gap-8 mb-8">
          <div class="overview-card flex-1 px-6 py-8 md:px-8">
            <h3 class="overview-label">About</h3>
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
              This is a schoolproject that i created in Adobe XD. I wanted to create a smartwatch
              app that could be used to watch your crypto. I used LottieFiles to implement the
              animations in Adobe XD and Adobe AfterEffects to create them.
            </p>
          </div>
        </div>

        <!-- Languages & Tools -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div class="overview-card px-6 py-8">
            <h3 class="overview-label">Languages</h3>
            <div class="flex flex-wrap gap-2">
              <span class="overview-badge">Adobe XD</span>
              <span class="overview-badge">LottieFiles</span>
              <span class="overview-badge">Adobe AfterEffects</span>
              <span class="overview-badge">Adobe Illustrator</span>
            </div>
          </div>
          <div class="overview-card px-6 py-8">
            <h3 class="overview-label">Tools</h3>
            <div class="flex flex-wrap gap-2">
              <span class="overview-badge">Visual Studio Code</span>
              <span class="overview-badge">Azure Portal</span>
              <span class="overview-badge">Amazon AWS</span>
              <span class="overview-badge">Adobe XD</span>
            </div>
          </div>
        </div>

        <!-- View Other Projects -->
        <div class="mt-4 hover:text-teal-800 text-teal-600 inline-block dark:hover:text-teal-300">
          <router-link class="flex items-center" to="/projects">
            <ArrowRight class="animate-bouncer mr-2" />
            <span
              class="font-medium text-teal-600 hover:text-teal-800 sm:text-lg dark:hover:text-teal-300"
            >
              View other projects
            </span>
          </router-link>
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

/* Overview section: accent-bordered cards */
.overview-card {
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.04), rgba(20, 184, 166, 0.09));
  border-radius: 0.75rem;
  transition: box-shadow 0.3s ease;
}

.overview-card:hover {
  box-shadow: 0 4px 24px rgba(20, 184, 166, 0.08);
}

.dark .overview-card {
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.05), rgba(45, 212, 191, 0.12));
}

.dark .overview-card:hover {
  box-shadow: 0 4px 24px rgba(45, 212, 191, 0.1);
}

/* Overview section: uppercase label */
.overview-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #0d9488;
  margin-bottom: 0.875rem;
}

.dark .overview-label {
  color: #5eead4;
}

/* Overview section: pill badges */
.overview-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #0f766e;
  background: rgba(20, 184, 166, 0.08);
  box-shadow: inset 0 0 0 1px rgba(20, 184, 166, 0.2);
  transition: all 0.2s ease;
  cursor: default;
}

.overview-badge:hover {
  background: rgba(20, 184, 166, 0.16);
  transform: translateY(-1px);
  box-shadow:
    inset 0 0 0 1px rgba(20, 184, 166, 0.3),
    0 2px 8px rgba(20, 184, 166, 0.1);
}

.dark .overview-badge {
  color: #99f6e4;
  background: rgba(45, 212, 191, 0.12);
  box-shadow: inset 0 0 0 1px rgba(45, 212, 191, 0.25);
}

.dark .overview-badge:hover {
  background: rgba(45, 212, 191, 0.22);
  box-shadow:
    inset 0 0 0 1px rgba(45, 212, 191, 0.4),
    0 2px 8px rgba(45, 212, 191, 0.15);
}
</style>
