<template>
  <div class="pb-10 fade-out">
    <div class="mx-auto max-w-screen-xl pt-10">
      <div class="text-center">
        <h1 class="mx-5 mb-5 text-6xl font-bold text-teal-700 md:text-8xl dark:text-teal-300">
          About me
        </h1>
        <p class="text-lg font-medium text-teal-500 dark:text-teal-100">My story</p>
      </div>
      <div class="md:space-x-15 mx-5 mt-10 mb-10 md:flex md:justify-around">
        <div class="mb-10 w-full">
          <img
            src="/education.jpg"
            alt="Robbe Saelens"
            class="scale w-100% h-80 rounded-xl object-cover"
          />
          <div class="w-full md:max-w-xl">
            <p class="mt-3 text-xl font-bold text-teal-800 dark:text-teal-300">Education</p>
            <p class="dark:text-gray">
              In 2018 I started the graduate education in Multimedia & Information Technologies.
              There I learned all the basics of programming and web development.
            </p>
            <p class="mt-2 dark:text-gray">
              After MIT I wanted to learn more about web development, so I started the bachelors
              degree Multimedia & Communication Technologies as
              <a
                class="font-medium underline"
                target="_blank"
                href="https://mct.be/programma/next-web-developer/"
                >Next Web Developer</a
              >.
            </p>
          </div>
        </div>
        <div class="w-full">
          <img
            src="/coding.jpg"
            alt="Robbe Saelens"
            class="scale w-100% h-80 rounded-xl object-cover"
          />
          <div class="w-full md:max-w-xl">
            <p class="mt-3 text-xl font-bold text-teal-800 dark:text-teal-300">Experience</p>
            <p class="mt-2 dark:text-gray">
              In February 2023 I started as an intern at
              <a
                class="font-medium underline"
                target="_blank"
                href="https://www.yourmindourwork.be/"
                >Your Mind Our Work</a
              >. After my internship I started working there as a
              <strong>PHP & Magento developer.</strong>
            </p>
            <p class="mt-2 dark:text-gray">
              I transitioned from my role as a PHP & Magento developer at YMOW to become a
              <strong> Junior Backend Developer </strong> at
              <a class="font-medium underline" target="_blank" href="https://www.dms.be/"> DMS</a>.
              Excited to bring my experience to new projects and continue growing!
            </p>
          </div>
        </div>
      </div>
      <div class="md:space-x-15 mx-5 mt-10 mb-10 md:flex md:justify-around">
        <div class="mb-10 w-full">
          <img
            src="/about.jpg"
            alt="Robbe Saelens"
            class="w-100% scale h-80 rounded-xl object-cover"
          />
          <div class="w-full md:max-w-xl">
            <p class="mt-3 text-xl font-bold text-teal-800 dark:text-teal-300">Teaching</p>
            <p class="dark:text-gray">
              In 2017 I started as instructor in equestrian sports. Since then I learned a lot about
              teaching and how to work with people. I currently work as an instructor at
              <a
                class="font-medium underline"
                target="_blank"
                href="https://www.sport.vlaanderen/onze-centra/woumen/"
                >Sport Vlaanderen Woumen</a
              >.
            </p>
          </div>
        </div>
        <div class="w-full">
          <img
            src="/handshake.jpg"
            alt="Robbe Saelens"
            class="w-100% scale h-80 rounded-xl object-cover"
          />
          <p class="mt-3 text-xl font-bold text-teal-800 dark:text-teal-300">Work together?</p>
          <p class="dark:text-gray">I'm available for freelance work and collaborations.</p>
          <p class="dark:text-gray">
            Mail me at
            <span class="cursor-pointer font-medium underline" @click="mailto"
              >robbe.saelens@telenet.be</span
            >
          </p>
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
