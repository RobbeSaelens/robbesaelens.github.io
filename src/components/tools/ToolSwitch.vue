<!--
  The switch between the two tools on the tools page: a tablist of two tabs, each with the
  tool's own icon, its name and a few words. It sticks under the header while the page
  scrolls, so the other tool is always one click away.

  The tabs are links (#project-updater, #sift) with the tab role: before the app runs they
  work as plain links (tools-page.css shows the tool the URL's hash names), once it runs
  they pick the tool without leaving the page. Arrow keys, Home and End move between them
  and pick at once, as tabs do; only the picked one is a tab stop.

  The picked tab gets StarBorder's light (Vue Bits): it runs once along its top and bottom
  edges, in the tool's colour, when the page opens and each time the tab is picked, and
  then rests; not with reduced motion.
-->
<template>
  <div class="tool-switch-bar">
    <div class="tool-switch" role="tablist" :aria-label="$t('tools.switchLabel')" @keydown="onKey">
      <StarBorder
        v-for="tool in tools"
        :id="tool.id"
        :key="tool.id"
        as="a"
        :href="`#${tool.id}`"
        role="tab"
        :aria-selected="tool.id === active ? 'true' : 'false'"
        :aria-controls="`${tool.id}-panel`"
        :tabindex="tool.id === active ? 0 : -1"
        custom-class="tool-tab"
        :class="{ 'is-active': tool.id === active }"
        :data-tool="tool.id"
        color="var(--tool-star)"
        speed="1.6s"
        inner-class="tool-tab-inner"
        :sweep="sweeps[tool.id]"
        @click.prevent="emit('select', tool.id)"
      >
        <ToolIcon :tool="tool.id" class="tool-tab-icon" />
        <span class="tool-tab-text">
          <span class="tool-tab-name">{{ tool.name }}</span>
          <span class="tool-tab-role">{{ tool.role }}</span>
        </span>
      </StarBorder>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import StarBorder from '../StarBorder.vue'
import ToolIcon from './ToolIcon.vue'
import type { ToolData, ToolId } from '../../tools'

const props = defineProps<{ tools: ToolData[]; active: ToolId }>()
const emit = defineEmits<{ select: [id: ToolId] }>()

/** How often each tab's light has run: a new number runs it once more */
const sweeps = reactive<Record<ToolId, number>>({ 'project-updater': 0, sift: 0 })

watch(
  () => props.active,
  (id) => (sweeps[id] += 1),
)

/** Once when the page opens, after the switch has risen in */
let opening = 0
onMounted(() => {
  opening = window.setTimeout(() => (sweeps[props.active] += 1), 700)
})
onBeforeUnmount(() => clearTimeout(opening))

function onKey(event: KeyboardEvent) {
  const ids = props.tools.map((tool) => tool.id)
  const at = ids.indexOf(props.active)
  const to =
    event.key === 'ArrowRight' || event.key === 'ArrowDown'
      ? (at + 1) % ids.length
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? (at - 1 + ids.length) % ids.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? ids.length - 1
            : -1
  if (to < 0) return
  event.preventDefault()
  emit('select', ids[to])
  document.getElementById(ids[to])?.focus()
}
</script>
