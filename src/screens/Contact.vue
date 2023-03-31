<template>
  <h1 class="mx-auto my-auto mb-5 max-w-screen-2xl px-6 text-4xl font-bold">About me</h1>
  <div class="animate__animated animate__backInDown mx-auto my-auto max-w-screen-2xl px-6">
    <div class="pb-50 h-screen items-start justify-between overflow-y-auto lg:flex">
      <div class="max-w-150 lg:max-w-1/2 space-y-5">
        <div class="space-y-5 text-lg">
          <p>
            <span class="text-xl font-bold text-teal-700">Hi!</span> I'm Robbe Saelens. I am a
            student at Howest Kortrijk where I am pursuing a Bachelor's degree in Multimedia &
            Creative Technologies (MCT).
          </p>
          <p>
            I like making <span class="italic">"cool stuff"</span> and discovering new things. In
            addition to my <span class="font-medium">passion for IT</span>, I am also a certified
            <span class="font-medium">instructor in equestrian sports</span>.
          </p>
        </div>
        <div class="flex items-center pt-8 text-teal-900">
          <GraduationCap />
          <h1 class="ml-1 text-2xl font-bold">Education</h1>
        </div>
        <p>
          <span class="mr-1 font-bold text-teal-700">01. </span> In 2016 I started my IT adventure
          in VTI Brugge Zandstraat. There i learned all the basic HTML, CSS and Graphic design.
        </p>
        <p>
          <span class="mr-1 font-bold text-teal-700">02. </span> After that i went to Howest
          Kortrijk where i started the graduate education in Multimedia & Information Technologies
          (MIT). There i learned all the basics of programming and web development.
        </p>
        <p>
          <span class="mr-1 font-bold text-teal-700">03. </span> After MIT I wanted to learn more
          about web development, so I started the bachelors degree Multimedia & Communication
          Technologies (MCT) as
          <a
            class="font-medium underline"
            target="_blank"
            href="https://mct.be/programma/next-web-developer/"
            >Next Web Developer</a
          >.
        </p>
        <div class="flex items-center pt-8 text-teal-900">
          <Briefcase />
          <h1 class="ml-1 text-2xl font-bold">Experience</h1>
        </div>
        <p>
          <span class="mr-1 font-bold text-teal-700">01. </span>In 2017 i started as instructor in
          equestrian sports. Since then I learned a lot about teaching and how to work with people,
          and also learned a lot about how to manage a team. I currntly work as an instructor at
          <a class="font-medium underline" target="_blank" href="https://www.acsystems.be/"
            >Sport Vlaanderen Woumen</a
          >.
        </p>
        <p>
          <span class="mr-1 font-bold text-teal-700">02. </span> I was an intern at
          <a class="font-medium underline" target="_blank" href="https://www.acsystems.be/"
            >AC Systems</a
          >
          for a couple of months. There I mainly did automatisations for the internal workflow with
          Google App Script.
        </p>
        <p>
          <span class="mr-1 font-bold text-teal-700">03. </span> In February 2023 i started as an
          intern at
          <a class="font-medium underline" target="_blank" href="https://www.yourmindourwork.be/"
            >Your Mind Our Work</a
          >. There I worked a lot with PHP and Magento. This internship was a great experience and I
          learned a lot.
        </p>
      </div>
      <img
        class="animate-breathe w-100 mt-10 object-contain lg:mt-0 lg:block"
        src="/about.jpg"
        alt=""
      />
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
