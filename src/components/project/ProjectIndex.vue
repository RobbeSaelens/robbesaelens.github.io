<!--
  A numbered index on a project page ("What's in it", Stable Manager's Drupal points):
  01, 02, … with a title and a text each, between hairlines instead of in boxes. Three
  columns from 1024px (two with `pairs`), two from 640px.

  Phones get the titles only, each a row that opens its text: a <details>, so it works
  without JavaScript, by keyboard (Tab, Enter or Space) and for screen readers, and the
  text stays in the HTML. Folded in CSS first (project-page.css, global, so it applies
  before the app runs): the prerendered page comes closed, and from 640px
  `::details-content` shows the text of a closed one too. Once the app runs,
  wider screens open them all and the titles stop being toggles (no tab stop, a click
  does nothing), so what is read out matches what is shown.
-->
<template>
  <ol class="index" :class="{ 'index--pairs': pairs }">
    <GlowCard v-for="(item, i) in items" :key="item.title" as="li" class="index-item reveal">
      <details class="index-fold" :open="open[i] || undefined" @toggle="onToggle(i, $event)">
        <summary class="index-head" :tabindex="folds ? undefined : -1" @click="onSummary">
          <span class="index-n" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
          <h3 class="index-title">{{ item.title }}</h3>
          <Plus class="index-plus" aria-hidden="true" />
        </summary>
        <p class="index-text">{{ item.text }}</p>
      </details>
    </GlowCard>
  </ol>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import GlowCard from '../GlowCard.vue'
import type { IndexItem } from './project'

const props = withDefaults(defineProps<{ items: IndexItem[]; pairs?: boolean }>(), { pairs: false })

/** Phone-only CSS is (max-width: 639px), the complement of UnoCSS sm: (AGENTS.md). */
const PHONE = '(max-width: 639px)'
const media = typeof window !== 'undefined' ? window.matchMedia(PHONE) : null

/** Rows that fold: on phones, and in the prerendered HTML (there CSS shows them from 640px). */
const folds = ref(media ? media.matches : true)
const open = ref<boolean[]>(props.items.map(() => !folds.value))
watch(
  () => props.items.length,
  (n) => (open.value = Array.from({ length: n }, () => !folds.value)),
)

function onToggle(i: number, event: Event) {
  open.value[i] = (event.target as HTMLDetailsElement).open
}

/** Wider screens: the text is always there, so the title doesn't toggle it. */
function onSummary(event: MouseEvent) {
  if (!folds.value) event.preventDefault()
}

function onMedia() {
  folds.value = !!media?.matches
  open.value = open.value.map(() => !folds.value)
}
onMounted(() => media?.addEventListener('change', onMedia))
onBeforeUnmount(() => media?.removeEventListener('change', onMedia))
</script>
