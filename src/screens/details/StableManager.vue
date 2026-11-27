<template>
  <!-- Real screenshots of the running app -->
  <ProjectPage :project="project" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ProjectPage from '../../components/project/ProjectPage.vue'
import { stableManager } from './data'

const { t } = useI18n({ useScope: 'global' })

const project = computed(() => stableManager(t))
</script>
