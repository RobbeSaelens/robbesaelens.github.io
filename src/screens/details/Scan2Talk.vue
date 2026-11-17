<template>
  <!-- Real screenshots of the live site at scan2talk.be -->
  <ProjectPage :project="project">
    <!-- Its own block: how a check-in works, a recording beside the three steps -->
    <template #after-hero>
      <section class="project-band" aria-labelledby="flow-title">
        <h2 id="flow-title" class="project-h2 reveal">{{ $t('scan2talk.flowTitle') }}</h2>
        <div class="flow project-split">
          <!-- A real check-in, recorded in the app's demo mode (nothing is saved).
               Plays only while on screen; never on its own for reduced-motion users.
               The poster is the WebP copy of scan2talk-checkin-poster.jpg (scripts/images.mjs):
               a poster takes one URL, and every browser this site supports shows WebP. -->
          <figure class="flow-phone reveal">
            <span class="shot-notch" aria-hidden="true"></span>
            <video
              ref="flowVideo"
              :aria-label="$t('scan2talk.flowVideo')"
              poster="/img/scan2talk-checkin-poster.webp"
              width="600"
              height="1298"
              muted
              loop
              playsinline
              preload="none"
              :controls="reduceMotion"
            >
              <source src="/scan2talk-checkin.webm" type="video/webm" />
              <source src="/scan2talk-checkin.mp4" type="video/mp4" />
            </video>
          </figure>

          <ol class="flow-steps">
            <li v-for="(step, i) in steps" :key="step.title" class="flow-step reveal">
              <span class="flow-n" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
              <div>
                <h3 class="flow-title">{{ step.title }}</h3>
                <p class="flow-text">{{ step.text }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </template>
  </ProjectPage>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ProjectPage from '../../components/project/ProjectPage.vue'
import { scan2talk, scan2talkCheckIn } from './data'

const { t } = useI18n({ useScope: 'global' })

const project = computed(() => scan2talk(t))

const steps = computed(() => scan2talkCheckIn(t).steps)

/** Plays the check-in video while it is on screen. */
const flowVideo = ref<HTMLVideoElement | null>(null)
const reduceMotion = ref(false)
let observer: IntersectionObserver | undefined

onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const video = flowVideo.value
  if (!video || reduceMotion.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {})
      else video.pause()
    },
    { threshold: 0.35 },
  )
  observer.observe(video)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
/* The recording on the left (the hero has the text there: the eye zigzags down), the
   steps beside it; on phones and tablets the recording first, smaller, then the steps */
.flow {
  justify-items: center;
}
.flow-steps {
  justify-self: stretch;
}
.flow-phone {
  width: min(13rem, 60%);
  margin: 0;
  padding: 0.5rem;
  border-radius: 1.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}
@media (min-width: 1024px) {
  .flow-phone {
    width: 17rem;
  }
}
.flow-phone video {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1.1rem;
  background: #e8f6f5;
}

.flow-steps {
  display: grid;
  gap: 1.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.flow-step {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr);
  gap: 0.5rem;
}
.flow-n {
  font-family: var(--font-mono);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-accent);
}
.flow-title {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--color-text-primary);
}
.flow-text {
  margin-top: 0.35rem;
  max-width: 62ch;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: var(--color-text-secondary);
}
</style>
