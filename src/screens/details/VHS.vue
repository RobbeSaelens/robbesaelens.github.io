<template>
  <!-- Real screenshots of the new site, which isn't live yet (rebranding) -->
  <ProjectPage :project="project" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ProjectPage from '../../components/project/ProjectPage.vue'
import { vhs } from './data'

const { t } = useI18n({ useScope: 'global' })

const project = computed(() => vhs(t))
</script>
