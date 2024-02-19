<template>
  <div class="flex h-screen flex-col items-center justify-center bg-gray-100">
    <div class="mb-5 animate-pulse">
      <img src="/Logo.png" alt="Logo" class="h-10" />
    </div>
    <div class="mt-5 px-5 text-center text-xl font-medium text-teal-800 dark:text-teal-500">
      Loading awesomeness... <br />Please stand by
    </div>
  </div>
</template>

<script>
export default {
  name: 'SplashScreen',
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
}</style>
