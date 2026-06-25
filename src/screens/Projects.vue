<template>
  <div class="fade-out flex flex-1 flex-col overflow-x-hidden">
    <h1
      class="mx-auto mb-8 max-w-screen-2xl px-6 pt-2 text-5xl font-bold text-teal-800 dark:text-teal-300 md:text-7xl"
    >
      Favorite projects
    </h1>
    <div class="content-wrapper mx-auto flex min-h-0 max-w-screen-2xl flex-1 flex-col px-6">
      <div class="galeri mb-3">
        <button
          @click="goToBinance"
          class="galeri-item"
          style="background-image: url('/Mockup.jpg')"
          :aria-label="'View Binance project details'"
        ></button>
        <button
          @click="goToAzureDetail"
          class="galeri-item"
          style="background-image: url('/ResearchMockup.jpg')"
          :aria-label="'View Azure Search project details'"
        ></button>
        <button
          @click="goToVitalDetail"
          class="galeri-item"
          style="background-image: url('/Vital.JPG')"
          :aria-label="'View Vital Cities project details'"
        ></button>
        <button
          @click="goToBikeRental"
          class="galeri-item"
          style="background-image: url('/BikeRental.jpg')"
          :aria-label="'View BikeRental project details'"
        ></button>
      </div>
      <div class="slider-container mb-4">
        <div class="slider">
          <div class="dark:text-teal-300" v-for="(tag, index) in duplicatedHashtags" :key="index">
            {{ tag }}
          </div>
        </div>
      </div>
      <div class="my-4 text-teal-700 dark:text-teal-600">
        <p class="mb-2 text-center text-xl font-bold text-teal-800 dark:text-teal-500">
          Get in touch!
        </p>
        <div class="flex justify-center space-x-5">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.instagram.com/robbe.saelens/"
            aria-label="Follow me on Instagram"
          >
            <Instagram class="cursor-pointer dark:hover:text-teal-300 hover:text-teal-900" />
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.facebook.com/profile.php?id=100006223099352"
            aria-label="Connect on Facebook"
          >
            <Facebook class="cursor-pointer dark:hover:text-teal-300 hover:text-teal-900" />
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/"
            aria-label="Connect on LinkedIn"
          >
            <Linkedin class="cursor-pointer dark:hover:text-teal-300 hover:text-teal-900" />
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/RobbeSaelens"
            aria-label="View my GitHub profile"
          >
            <Github class="cursor-pointer dark:hover:text-teal-300 hover:text-teal-900" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
} from 'lucide-vue-next'

export default {
  data() {
    return {
      hashtags: [
        '#vuejs',
        '#javascript',
        '#XD',
        '#SaaS',
        '#UI',
        '#UX',
        '#AWSOpenSearch',
        '#AWS',
        '#AzureCognitiveSearch',
        '#Azure',
        '#AzureSearch',
        '#gatsby',
        '#graphql',
        '#scrollytelling',
        '#css',
        '#html',
        '#vue',
        '#tailwindcss',
        '#tailwind',
        '#react',
        '#reactnative',
      ],
    }
  },
  computed: {
    duplicatedHashtags() {
      return this.hashtags.concat(this.hashtags)
    },
  },
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
  },

  methods: {
    goToAzureDetail() {
      this.$router.push({ name: 'AzureDetail' })
    },
    goToVitalDetail() {
      this.$router.push({ name: 'VitalDetail' })
    },
    goToBinance() {
      this.$router.push({ name: 'BinanceDetail' })
    },
    goToBikeRental() {
      this.$router.push({ name: 'BikeRentalDetail' })
    },
  },
}
</script>

<style>
.galeri {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  gap: 1rem;
}

.galeri-item {
  flex: 1;
  border-radius: 1rem;
  background-position: center;
  background-repeat: no-repeat;
  background-size: auto 100%;
  transition: all 0.5s cubic-bezier(0.25, 0.4, 0.45, 1.4);
  opacity: 0.9;
  border: 1px solid #ccc;
  cursor: pointer;
  min-height: 0;
  min-width: 0;
  padding: 0;
  background-color: transparent;
}

.galeri-item:hover {
  flex: 3;
  background-size: auto 110%;
  opacity: 1;
}

/* === galeri responsive === */
@media (max-width: 768px) {
  .content-wrapper {
    flex: none;
    min-height: auto;
  }

  .galeri {
    display: flex;
    flex-direction: column;
    flex: none;
    width: 100%;
    height: auto;
    min-height: unset;
    gap: 1rem;
    overflow: hidden;
  }

  .galeri-item {
    width: 100%;
    min-height: 250px;
    flex: none;
    box-sizing: border-box;
    background-size: cover;
    background-position: center;
  }

  .galeri-item:hover {
    flex: none;
    background-size: cover;
  }
}

.slider-container {
  width: 100%;
  overflow: hidden;
}

.slider {
  display: flex;
  animation: slide 20s infinite linear;
}

.slider div {
  margin-right: 20px;
  white-space: nowrap;
  font-size: 1rem;
  font-style: italic;
  color: teal;
}

@keyframes slide {
  0% {
    transform: translateX(0%);
  }

  100% {
    transform: translateX(-50%);
  }
}
</style>
