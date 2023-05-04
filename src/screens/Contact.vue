<template>
  <div class="mx-auto my-auto max-w-screen-xl pt-10">
    <div class="text-center">
      <h1 class="mb-5 text-8xl font-bold text-teal-700">Robbe Saelens</h1>
      <p class="text-lg font-medium text-teal-500">My story</p>
    </div>
    <div class="mt-10 flex justify-around">
      <div>
        <img src="/education.jpg" alt="Robbe Saelens" class="w-150 h-80 rounded-xl object-cover" />
        <div class="max-w-xl">
          <p class="mt-3 text-xl font-bold text-teal-800">Education</p>
          <p>
            In 2018 I started the graduate education in Multimedia & Information Technologies. There
            I learned all the basics of programming and web development.
          </p>
          <p class="mt-2">
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
      <div>
        <img src="/coding.jpg" alt="Robbe Saelens" class="w-150 h-80 rounded-xl object-cover" />
        <div class="max-w-md">
          <p class="mt-3 text-xl font-bold text-teal-800">Experience</p>
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
}
</script>

<style>
.animate-breathe {
  animation: breathe 2s infinite;
  /* rounded */
  border-radius: 1rem;
}

@keyframes breathe {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.01);
  }
  100% {
    transform: scale(1);
  }
}
</style>
