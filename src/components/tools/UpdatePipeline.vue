<!--
  How an update runs in Project Updater, as five steps on a line: scan, update with Claude
  Code, check before and after, review, publish (or throw it away). Once, when it scrolls
  into view, the line fills from the first step to the last and each step lights up as
  the line reaches it (usePlayOnce: transform and opacity only, about 1.6 s); at rest, and
  with reduced motion, every step is lit. An ordered list, so screen readers get the steps
  in order; the icons and the line are decoration.

  Styles in tools-page.css (.pipeline), global like the rest of the page's.
-->
<template>
  <div ref="root" class="pipeline" :class="state">
    <ol class="flow">
      <li v-for="(step, i) in steps" :key="step.title" class="flow-step" :style="{ '--i': i }">
        <span class="flow-node" aria-hidden="true">
          <component :is="ICONS[i]" class="flow-icon" />
        </span>
        <span class="flow-body">
          <span class="flow-title">{{ step.title }}</span>
          <span class="flow-text">{{ step.text }}</span>
          <span v-if="i === steps.length - 1" class="flow-or">
            <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
            {{ or }}
          </span>
        </span>
      </li>
    </ol>
    <span class="flow-track" aria-hidden="true"><span class="flow-fill"></span></span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Bot, Eye, ListChecks, Radar, Send, Trash2 } from 'lucide-vue-next'
import { usePlayOnce } from '../../composables/usePlayOnce'
import type { ToolStep } from '../../tools'

defineProps<{ steps: ToolStep[]; or: string }>()

/** Scan, update, check, review, publish */
const ICONS = [Radar, Bot, ListChecks, Eye, Send]

const root = ref<HTMLElement | null>(null)
const state = usePlayOnce(root)
</script>
