<template>
  <!-- A MacBook Pro built from CSS 3D planes, with a real screenshot on its screen.
       The parent poses it with inherited custom properties:
         --ry, --rx   turn and tilt of the whole laptop
         --lid        lid angle: 0 is upright, positive leans back, -90 is closed
         --tx, --ty   extra tilt (the mouse), on its own layer so it adds to the pose
       `active` adds a slow idle sway. -->
  <div class="mb-scene" :class="{ 'is-active': active }">
    <div class="mb-pose">
      <div class="mb-sway">
        <div class="mb-tilt">
          <div class="mb">
            <div class="mb-floor" aria-hidden="true"></div>
            <!-- The base's thickness: rounded layers under its top, so the edges
                 follow its rounded corners -->
            <div
              v-for="i in BASE_LAYERS"
              :key="`base-${i}`"
              class="mb-base-layer"
              :style="{ '--i': i }"
              aria-hidden="true"
            ></div>
            <div class="mb-base-top" aria-hidden="true">
              <span class="mb-speaker mb-speaker--left"></span>
              <span class="mb-speaker mb-speaker--right"></span>
              <span class="mb-keyboard"></span>
              <span class="mb-trackpad"></span>
            </div>
            <div class="mb-lid">
              <div class="mb-lid-back" aria-hidden="true"></div>
              <div
                v-for="i in LID_LAYERS"
                :key="`lid-${i}`"
                class="mb-lid-layer"
                :style="{ '--i': i }"
                aria-hidden="true"
              ></div>
              <div class="mb-lid-front">
                <div class="mb-screen">
                  <img
                    class="mb-shot"
                    :src="src"
                    :alt="alt"
                    width="1600"
                    height="1000"
                    draggable="false"
                    :loading="loading"
                    :fetchpriority="fetchpriority"
                  />
                  <span class="mb-notch" aria-hidden="true"></span>
                </div>
                <span class="mb-glare" aria-hidden="true"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Layers that make up the thickness of the base (0.85em) and of the lid (0.38em) */
const BASE_LAYERS = 8
const LID_LAYERS = 2

defineProps<{
  /** A 16:10 screenshot (public/<project>-home.jpg) */
  src: string
  alt: string
  active?: boolean
  loading?: 'eager' | 'lazy'
  fetchpriority?: 'high' | 'low' | 'auto'
}>()
</script>

<style scoped>
/*
 * Sizes are in em, and the scene's font size fits the laptop in its container (a
 * size container): at rest it takes about 47 x 39 em, plus 0.6em for the sway. It
 * stands at the bottom of its container and may reach 1.5rem past the top, into the
 * carousel's padding. The laptop's origin is the hinge line; the base lies flat in front of
 * it (towards the viewer), the lid stands on it.
 */
.mb-scene {
  position: absolute;
  inset: 0;
  font-size: min(100cqw / 45, (100cqh + 1.5rem) / 39.8);
  perspective: 220em;
  perspective-origin: 50% 30%;
  pointer-events: none;
}
.mb-pose,
.mb-sway,
.mb-tilt,
.mb,
.mb-lid {
  transform-style: preserve-3d;
}
.mb-pose {
  position: absolute;
  left: 50%;
  top: 100%;
  width: 36em;
  height: 0;
  /* The hinge line, placed so the front of the base stands on the bottom */
  margin: -9.4em 0 0 -18em;
  transform-origin: 18em -8em 12em;
  transform: rotateX(var(--rx, -18deg)) rotateY(var(--ry, -24deg));
  transition: transform 1.3s cubic-bezier(0.25, 1, 0.5, 1);
}
.mb-sway,
.mb-tilt,
.mb {
  position: absolute;
  inset: 0;
  transform-origin: 18em -8em 12em;
}
/* Eased frame by frame by the parent (Projects.vue), so no transition here */
.mb-tilt {
  transform: rotateX(var(--tx, 0deg)) rotateY(var(--ty, 0deg));
}
.is-active .mb-sway {
  animation: mb-sway 10s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate;
  animation-play-state: var(--sway, running);
}
@keyframes mb-sway {
  from {
    transform: rotateY(-5deg) translateY(0);
  }
  to {
    transform: rotateY(5deg) translateY(-0.6em);
  }
}
.mb > * {
  position: absolute;
  left: 0;
  top: 0;
}

/* ── Base ── */
.mb-base-top {
  width: 36em;
  height: 24.5em;
  transform-origin: top center;
  transform: rotateX(90deg);
  border-radius: 0.5em 0.5em 1.1em 1.1em;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0, rgba(0, 0, 0, 0) 1.3em),
    radial-gradient(120% 90% at 30% 10%, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 60%),
    linear-gradient(160deg, #e4e5e7, #cbcdd0 55%, #b9bbbf);
  box-shadow: inset 0 0 0 0.06em rgba(255, 255, 255, 0.6);
}
.mb-keyboard {
  position: absolute;
  left: 4.6em;
  top: 1.7em;
  width: 26.8em;
  height: 11.1em;
  border-radius: 0.55em;
  background: url('../assets/macbook-keyboard.svg') center / calc(100% - 0.7em) calc(100% - 0.7em) no-repeat, #16171a;
  box-shadow: inset 0 0.08em 0.2em rgba(0, 0, 0, 0.6);
}
.mb-speaker {
  position: absolute;
  top: 1.8em;
  width: 3em;
  height: 10.9em;
  background: radial-gradient(circle, rgba(40, 42, 46, 0.55) 0.07em, transparent 0.09em) 0 0 / 0.36em 0.36em;
}
.mb-speaker--left {
  left: 1.1em;
}
.mb-speaker--right {
  right: 1.1em;
}
.mb-trackpad {
  position: absolute;
  left: 50%;
  top: 13.9em;
  width: 15.6em;
  height: 9.6em;
  margin-left: -7.8em;
  border-radius: 0.8em;
  background: linear-gradient(160deg, #dcdee1, #c9cbce);
  box-shadow:
    inset 0 0 0 0.05em rgba(0, 0, 0, 0.12),
    inset 0 0.06em 0 rgba(255, 255, 255, 0.7);
}
/* Under the top, every 0.85 / 8 em: the sides, darker towards the bottom */
.mb-base-layer {
  width: 36em;
  height: 24.5em;
  transform-origin: top center;
  transform: translateY(calc(var(--i) * 0.106em)) rotateX(90deg);
  border-radius: 0.5em 0.5em 1.1em 1.1em;
  background: hsl(220 3% calc(80% - var(--i) * 3.5%));
}
.mb-floor {
  left: -6em;
  top: 0.9em;
  width: 48em;
  height: 36em;
  transform-origin: top center;
  transform: rotateX(90deg) translateY(-4em);
  background: radial-gradient(closest-side, rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.12) 55%, transparent);
  filter: blur(0.6em);
}

/* ── Lid, hinged just behind the back of the base ── */
.mb-lid {
  top: -23.6em;
  width: 36em;
  height: 23.6em;
  transform-origin: bottom center;
  transform: translateZ(0.9em) rotateX(var(--lid, 14deg));
  transition: transform 1.4s cubic-bezier(0.25, 1, 0.5, 1) 0.12s;
}
.mb-lid > * {
  position: absolute;
  inset: 0;
}
.mb-lid-front {
  backface-visibility: hidden;
  border-radius: 1.15em 1.15em 0.35em 0.35em;
  padding: 0.55em 0.75em 0.75em;
  background: #0c0d0f;
  /* The lid's aluminium edge, drawn around the bezel: in the same plane as the
     screen, so it stays one clean line at any angle */
  box-shadow:
    inset 0 0 0 0.12em #2a2c30,
    0 0 0 0.09em #a7aaae;
}
.mb-screen {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 0.55em 0.55em 0.1em 0.1em;
  background: #000;
}
/* macOS keeps full-screen apps below the notch: the rest of the panel is 16:10 */
.mb-shot {
  position: absolute;
  left: 0;
  bottom: 0;
  display: block;
  width: 100%;
  height: 96.7%;
  object-fit: cover;
  object-position: top;
}
.mb-notch {
  position: absolute;
  left: 50%;
  top: 0;
  width: 5.6em;
  height: 0.78em;
  margin-left: -2.8em;
  border-radius: 0 0 0.45em 0.45em;
  background: #000;
}
.mb-notch::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0.22em;
  width: 0.3em;
  height: 0.3em;
  margin-left: -0.15em;
  border-radius: 50%;
  background: #1b2a33;
}
.mb-glare {
  border-radius: inherit;
  background: linear-gradient(118deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 34%, rgba(255, 255, 255, 0) 35%);
  pointer-events: none;
}
.mb-lid-back {
  backface-visibility: hidden;
  transform: rotateY(180deg) translateZ(0.38em);
  border-radius: 1.15em 1.15em 0.35em 0.35em;
  background:
    radial-gradient(90% 70% at 70% 20%, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0) 60%),
    linear-gradient(200deg, #e6e8ea, #c4c6c9 55%, #b2b4b8);
}
/* Between the screen and the back: the lid's thickness, seen from the side */
.mb-lid-layer {
  inset: 0.04em !important;
  transform: translateZ(calc(var(--i) * -0.127em));
  border-radius: 1.15em 1.15em 0.35em 0.35em;
  background: #b9bcc0;
}

@media (prefers-reduced-motion: reduce) {
  .mb-pose,
  .mb-tilt,
  .mb-lid {
    transition: none;
  }
  .is-active .mb-sway {
    animation: none;
  }
}
</style>

<style>
/* Closed until the page's intro has played (html.intro-done, styles.css), then it
   opens. Without JavaScript there is no intro: it stays open. Not scoped: a scoped
   rule can't start from <html>. */
html.js:not(.intro-done) .mb-scene {
  --lid: -90deg;
}
</style>
