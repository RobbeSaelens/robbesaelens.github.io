<template>
  <div class="pt-10 pb-5">
    <h1 class="font-bold text-5xl text-neutral-100">Profile</h1>
    <hr class="bg-teal-600 mt-4 w-45 rounded-md border-1" />
  </div>
  <div class="flex space-x-15">
    <div>
      <img
        class="object-contain h-125"
        src="/pf.jpg"
        alt="My profile picture"
      />
    </div>
    <div>
      <div class="space-y-3">
        <p class="text-neutral-300 text-6xl font-extrabold">
          Hi, my name is Robbe Saelens.
        </p>
        <p class="text-neutral-300 text-6xl font-extrabold">
          I'm a
          <span class="text-teal-800">next web developer!</span>
        </p>
      </div>
      <div class="w-3/5 space-y-3 text-lg mt-5">
        <p class="text-neutral-300">
          I'm a student in Howest Kortrijk where I follow the bachelor's degree
          <a class="underline hover:text-teal-600" href="https://mct.be/">
            Multimedia & Creative Technologies (MCT).</a
          >
        </p>
        <p class="text-neutral-300">
          In addition to my passion for web & app, I am also a certified teacher
          in the equestrian sport.
        </p>
      </div>
      <div class="mt-15">
        <p class="text-neutral-100 font-bold text-3xl mb-5 flex">
          I love to make projects with
          <Verified class="ml-2 text-neutral-100" />
        </p>
        <div class="flex text-md font-bold space-x-5 text-teal-600">
          <p>Vue.js</p>
          <p>CSS</p>
          <p>React</p>
          <p>HTML</p>
          <p>MongoDB</p>
          <p>NestJS</p>
          <p>TailwindCSS</p>
          <p>Javascript</p>
        </div>
        <div class="flex text-md font-bold space-x-5 text-teal-600 mt-2">
          <p>.NET</p>
          <p>Gatsby</p>
          <p>Typescript</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Verified } from 'lucide-vue-next'
export default {
  components: {
    Verified,
  },
}
</script>

