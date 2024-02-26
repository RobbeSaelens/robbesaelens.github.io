<template>
  <div class="fade-out overflow-hidden">
    <h1
      class="mx-auto my-auto mb-10 max-w-screen-2xl px-6 text-4xl font-bold text-teal-800 dark:text-teal-300"
    >
      Favorite projects
    </h1>
    <div class="mx-auto my-auto max-w-screen-2xl overflow-y-scroll px-6">
      <div class="galeri mb-10">
        <div
          @click="goToBinance"
          class="min-h-50"
          style="background-image: url('/mockup.jpg')"
        ></div>
        <div
          @click="goToAzureDetail"
          class="min-h-50"
          style="background-image: url('/ResearchMockup.jpg')"
        ></div>
        <div
          @click="goToVitalDetail"
          class="min-h-50"
          style="background-image: url('/Vital.jpg')"
        ></div>
        <div
          @click="goToBikeRental"
          class="min-h-50"
          style="background-image: url('/BikeRental.jpg')"
        ></div>
      </div>
      <div class="slider-container mb-10">
        <div class="slider">
          <div class="dark:text-teal-300" v-for="(tag, index) in duplicatedHashtags" :key="index">
            {{ tag }}
          </div>
        </div>
      </div>
      <div class="my-10">
        <p class="mb-3 text-center text-xl font-bold text-teal-900 dark:text-teal-300">
          Get in touch!
        </p>
        <div class="flex justify-center space-x-5 text-teal-800">
          <a target="_blank" href="https://www.instagram.com/robbe.saelens/">
            <Instagram class="cursor-pointer hover:fill-teal-300" />
          </a>
          <a target="_blank" href="https://www.facebook.com/profile.php?id=100006223099352">
            <Facebook class="cursor-pointer hover:fill-teal-300" />
          </a>
          <a target="_blank" href="https://www.linkedin.com/in/robbe-saelens-1a14511b8/">
            <Linkedin class="cursor-pointer hover:fill-teal-300" />
          </a>
          <a target="_blank" href="https://github.com/RobbeSaelens">
            <Github class="cursor-pointer hover:fill-teal-300" />
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
  height: 35rem;
  width: 100%;
  gap: 1rem;
}

.galeri > div {
  flex: 1;
  border-radius: 1rem;
  background-position: center;
  background-repeat: no-repeat;
  background-size: auto 100%;
  transition: all 0.5s cubic-bezier(0.25, 0.4, 0.45, 1.4);
  opacity: 0.9;
  border: 1px solid #ccc;
}

.galeri > div:hover {
  flex: 3;
  background-size: auto 110%;
  cursor: pointer;
  opacity: 1;
}

/* galeri responsive, disable flex on small screen and image contains full width */
@media (max-width: 768px) {
  .galeri {
    display: block;
    height: auto;
  }

  .galeri > div {
    flex: none;
    width: 100%;
    background-size: cover;
    margin-bottom: 2rem;
  }

  .galeri > div:hover {
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
