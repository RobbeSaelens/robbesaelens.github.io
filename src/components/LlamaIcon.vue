<template>
  <!-- A llama face: the chatbot answers with Meta's Llama model (via Cloudflare Workers AI) -->
  <svg
    class="llama-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M8.2 7.4C7.3 6.6 6.9 4.9 7.3 3c1.3.4 2.2 1.6 2.4 3.4" />
    <path d="M15.8 7.4c.9-.8 1.3-2.5.9-4.4-1.3.4-2.2 1.6-2.4 3.4" />
    <path d="M6.6 11.2C6.6 8.3 9 6.6 12 6.6s5.4 1.7 5.4 4.6v3.2c0 3.4-2.3 6.6-5.4 6.6s-5.4-3.2-5.4-6.6z" />
    <path d="M9.8 16.4c0-1.3 1-2.1 2.2-2.1s2.2.8 2.2 2.1-1 2.1-2.2 2.1-2.2-.8-2.2-2.1z" />
    <circle cx="9.5" cy="11.4" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="11.4" r="0.9" fill="currentColor" stroke="none" />
    <path d="M11.3 16.2l.7.6.7-.6" />
  </svg>
</template>

<style scoped>
.llama-icon {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
