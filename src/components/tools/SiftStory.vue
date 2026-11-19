<!--
  Why Sift exists, told as a picture rather than paragraphs: the two apps Robbe used
  (PhpStorm for diffs and commits, Sublime Merge for branches and history, by name only:
  no logos), and Sift, which merged them: both in one, light. The why comes first, as a
  statement; the picture beside it from 1024px (5 : 7, like the page's other splits), under
  it below that: the two side by side, an arrow down, Sift under both.

  Once, when it scrolls into view (usePlayOnce, about 1.2 s, transform and opacity only),
  as a real merge: the two cards slide in from the left and the right and meet at the plus;
  a copy of each (aria-hidden) then folds into Sift's place, and Sift lands there with its
  icon and its colour. The statement comes up first. At rest, and with reduced motion, the whole
  picture at once, without the copies. The text reads in order for screen readers: the
  plus, the arrow and the copies are decoration.

  Styles in tools-page.css (.merge), global like the rest of the page's.
-->
<template>
  <figure ref="root" class="merge" :class="state">
    <figcaption class="merge-caption">{{ caption }}</figcaption>
    <div class="merge-row">
      <div class="merge-card merge-a">
        <span class="merge-name">{{ from[0].title }}</span>
        <span class="merge-does">{{ from[0].text }}</span>
      </div>
      <span class="merge-plus" aria-hidden="true">+</span>
      <div class="merge-card merge-b">
        <span class="merge-name">{{ from[1].title }}</span>
        <span class="merge-does">{{ from[1].text }}</span>
      </div>
      <span class="merge-arrow" aria-hidden="true"><ArrowRight class="merge-arrow-icon" /></span>
      <div class="merge-card merge-to">
        <ToolIcon tool="sift" class="merge-icon" />
        <span class="merge-to-text">
          <span class="merge-name">{{ to.title }}</span>
          <span class="merge-does">{{ to.text }}</span>
        </span>
      </div>
      <!-- The copies that fold into Sift's place -->
      <div v-for="(app, i) in from" :key="app.title" class="merge-card merge-ghost" :class="`merge-ghost-${i ? 'b' : 'a'}`" aria-hidden="true">
        <span class="merge-name">{{ app.title }}</span>
        <span class="merge-does">{{ app.text }}</span>
      </div>
    </div>
  </figure>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import ToolIcon from './ToolIcon.vue'
import { usePlayOnce } from '../../composables/usePlayOnce'
import type { ToolStep } from '../../tools'

defineProps<{ from: ToolStep[]; to: ToolStep; caption: string }>()

const root = ref<HTMLElement | null>(null)
const state = usePlayOnce(root)
</script>
