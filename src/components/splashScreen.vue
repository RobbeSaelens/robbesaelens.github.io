<template>
  <div class="flex h-screen flex-col items-center justify-center bg-gray-100">
    <div class="mb-5 animate-pulse">
      <img src="/Logo.png" alt="Robbe Saelens logo" class="h-10 customFill" loading="lazy" />
    </div>
    <div class="mt-5 px-5 text-center text-xl font-medium text-teal-800 dark:text-teal-500">
      <span v-for="(line, i) in sloganLines" :key="i">
        {{ line }}<br v-if="i < sloganLines.length - 1" />
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SplashScreen',
  data() {
    return {
      sloganLines: [],
    }
  },
  mounted() {
    this.sloganLines = this.getRandomSlogan()
  },
  methods: {
    getRandomSlogan() {
      const slogans = [
        ['Loading brilliance', 'one line of code at a time!'],
        ['Unleashing the magic of code', 'just for you!'],
        ['Buckle up! Code in progress', 'Fasten your seatbelt!'],
        ['Brace yourself for a code-driven masterpiece!'],
        ['Loading awesomeness...', 'because backend is where the magic happens!'],
        ['Raising the code curtain', 'get ready for the backend spectacle!'],
        ['Cooking up code delicacies', 'just for you. Loading...'],
        ['Code may be silent, but the magic is loud', 'Loading greatness!'],
        ["Behind every pixel, there's a coder's touch", 'Loading brilliance now!'],
        ['Hold tight...', "we're injecting pure code joy into your experience!"],
      ]

      const randomIndex = Math.floor(Math.random() * slogans.length)
      return slogans[randomIndex]
    },
  },
}
</script>

<style>
@keyframes pulse {
  0% {
    opacity: 0.5;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}
</style>
