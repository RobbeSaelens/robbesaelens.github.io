<template>
  <!-- Real screenshots of the running v2.0 site at exulta.be -->
  <ProjectPage :project="project" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ProjectPage from '../../components/project/ProjectPage.vue'
import { indexItems, type ProjectData } from '../../components/project/project'

const { t } = useI18n({ useScope: 'global' })

const project = computed<ProjectData>(() => ({
  id: 'exulta',
  name: t('exulta.title'),
  file: 'exulta-project.md',
  status: { kind: 'live', label: t('project.live') },
  links: [
    { label: t('exulta.visitSite'), href: 'https://exulta.be' },
    { label: t('exulta.tryCalculator'), href: 'https://exulta.be/tentcalculator' },
  ],
  about: t('exulta.aboutText'),
  tags: ['Laravel 13', 'React 19', 'Inertia.js', 'Filament 5', 'Tailwind CSS 4', 'MySQL'],
  languages: ['PHP 8.4', 'Laravel 13', 'React 19', 'Inertia.js 3', 'Filament 5', 'Tailwind CSS 4', 'SCSS', 'MySQL'],
  tools: [
    'Vite 8',
    'GitHub Actions',
    'Playwright',
    'Lighthouse',
    'Spatie Media Library',
    'Spatie Backup',
    'Filament Shield',
    'Ziggy',
    'Pint',
  ],
  url: 'exulta.be',
  desktop: { src: '/exulta-home.jpg', width: 1600, height: 1000, alt: t('exulta.alt'), caption: 'exulta.be' },
  phone: {
    src: '/exulta-mobile.jpg',
    width: 369,
    height: 800,
    alt: t('exulta.alt'),
    caption: `exulta.be — ${t('projects.shotMobile')}`,
  },
  features: indexItems(t, 'exulta', 'feature', ['Catalog', 'Calculator', 'Admin', 'Content', 'Seo', 'Perf']),
  repo: { key: 'exulta' },
}))
</script>
