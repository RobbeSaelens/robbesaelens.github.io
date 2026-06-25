<template>
  <div class="fade-out flex flex-1 flex-col">
    <h1
      class="mx-auto mb-2 max-w-screen-2xl px-6 pt-2 text-5xl font-bold text-teal-800 dark:text-teal-300 md:text-7xl"
    >
      About me
    </h1>
    <p
      class="mx-auto max-w-screen-2xl px-6 mb-4 text-lg font-medium text-teal-500 dark:text-teal-100"
    >
      My story
    </p>

    <div class="content-wrapper mx-auto flex min-h-0 max-w-screen-2xl flex-1 flex-col px-6">
      <!-- Horizontal timeline cards -->
      <div class="cards-row mb-3">
        <!-- Teaching -->
        <div ref="teachingRef" :class="['timeline-card', teachingVisible ? 'animate-in' : '']">
          <img
            src="/about.jpg"
            alt="Robbe Saelens teaching equestrian sports"
            class="scale card-img"
            loading="lazy"
          />
          <div class="card-body">
            <h2 class="card-title">
              <BookOpen class="card-icon" />
              Teaching
            </h2>
            <p class="card-text">
              In 2017 I started as instructor in equestrian sports. Since then I learned a lot about
              teaching and how to work with people. I currently work as an instructor at
              <a
                class="card-link"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.sport.vlaanderen/onze-centra/woumen/"
                >Sport Vlaanderen Woumen</a
              >.
            </p>
          </div>
        </div>

        <!-- Connector -->
        <div class="timeline-connector">
          <div class="connector-line"></div>
          <div class="connector-arrow">
            <ArrowRight class="w-4 h-4" />
          </div>
        </div>

        <!-- Education -->
        <div ref="educationRef" :class="['timeline-card', educationVisible ? 'animate-in' : '']">
          <img
            src="/education.jpg"
            alt="Graduation ceremony photo of Robbe Saelens"
            class="scale card-img"
            loading="lazy"
          />
          <div class="card-body">
            <h2 class="card-title">
              <GraduationCap class="card-icon" />
              Education
            </h2>
            <p class="card-text">
              In 2018 I started the graduate education in Multimedia &amp; Information Technologies.
              There I learned all the basics of programming and web development.
            </p>
            <p class="card-text mt-2">
              After MIT I started the bachelors degree in Multimedia &amp; Communication
              Technologies as
              <a
                class="card-link"
                target="_blank"
                rel="noopener noreferrer"
                href="https://mct.be/programma/next-web-developer/"
                >Next Web Developer</a
              >.
            </p>
          </div>
        </div>

        <!-- Connector -->
        <div class="timeline-connector">
          <div class="connector-line"></div>
          <div class="connector-arrow">
            <ArrowRight class="w-4 h-4" />
          </div>
        </div>

        <!-- Experience -->
        <div ref="experienceRef" :class="['timeline-card', experienceVisible ? 'animate-in' : '']">
          <img
            src="/coding.jpg"
            alt="Robbe Saelens coding at his development workspace"
            class="scale card-img"
            loading="lazy"
          />
          <div class="card-body">
            <h2 class="card-title">
              <Briefcase class="card-icon" />
              Experience
            </h2>
            <p class="card-text">
              In February 2023 I started as an intern at
              <a
                class="card-link"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.yourmindourwork.be/"
                >Your Mind Our Work</a
              >. After my internship I started working there as a
              <strong>PHP &amp; Magento developer.</strong>
            </p>
            <p class="card-text mt-2">
              I transitioned to become a
              <strong>Junior Backend Developer</strong> at
              <a
                class="card-link"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.dynamate.be/"
              >
                Dynamate</a
              >. Excited to bring my experience to new projects!
            </p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-bar">
        <div class="cta-inner">
          <MessageCircle class="cta-icon-lg" />
          <span class="cta-text">Work together?</span>
          <a class="cta-pill" href="mailto:robbe.saelens@telenet.be">
            robbe.saelens@telenet.be
            <ArrowRight class="cta-arrow" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Briefcase, GraduationCap, ArrowRight, BookOpen, MessageCircle } from 'lucide-vue-next'

export default {
  components: {
    Briefcase,
    GraduationCap,
    ArrowRight,
    BookOpen,
    MessageCircle,
  },
  data() {
    return {
      educationVisible: false,
      experienceVisible: false,
      teachingVisible: false,
      observer: null as IntersectionObserver | null,
    }
  },
  mounted() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement
            if (target === this.$refs.educationRef) this.educationVisible = true
            if (target === this.$refs.experienceRef) this.experienceVisible = true
            if (target === this.$refs.teachingRef) this.teachingVisible = true
          }
        })
      },
      { threshold: 0.05 },
    )

    const refs = [this.$refs.educationRef, this.$refs.experienceRef, this.$refs.teachingRef]
    refs.forEach((ref: any) => {
      if (ref && ref instanceof Element) this.observer!.observe(ref)
    })
  },
  beforeUnmount() {
    this.observer?.disconnect()
  },
}
</script>

<style>
/* === Image hover === */
.scale {
  transition: transform 0.5s ease-in-out;
}
.scale:hover {
  transform: scale(1.02);
}
@media (min-width: 768px) {
  .scale {
    transition: transform 0.3s ease-in-out;
  }
  .scale:hover {
    transform: scale(1.02);
  }
}

/* === Cards row (horizontal timeline) === */
.cards-row {
  display: flex;
  gap: 0;
  align-items: stretch;
}

.timeline-card {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.04), rgba(20, 184, 166, 0.09));
  border-radius: 0.75rem;
  transition: box-shadow 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.5s ease-out,
    transform 0.5s ease-out,
    box-shadow 0.3s ease;
}
.timeline-card.animate-in {
  opacity: 1;
  transform: translateY(0);
}
.timeline-card:hover {
  box-shadow: 0 4px 24px rgba(20, 184, 166, 0.08);
}
.dark .timeline-card {
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.05), rgba(45, 212, 191, 0.12));
}
.dark .timeline-card:hover {
  box-shadow: 0 4px 24px rgba(45, 212, 191, 0.1);
}

/* Stagger animation */
.cards-row .timeline-card:nth-child(1) {
  transition-delay: 0s;
}
.cards-row .timeline-card:nth-child(3) {
  transition-delay: 0.12s;
}
.cards-row .timeline-card:nth-child(5) {
  transition-delay: 0.24s;
}

/* === Horizontal connector === */
.timeline-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  flex-shrink: 0;
  gap: 0.25rem;
}

.connector-line {
  width: 2px;
  flex: 1;
  background: linear-gradient(to bottom, rgba(20, 184, 166, 0.2), rgba(20, 184, 166, 0.4));
  min-height: 2rem;
}
.dark .connector-line {
  background: linear-gradient(to bottom, rgba(45, 212, 191, 0.2), rgba(45, 212, 191, 0.4));
}

.connector-arrow {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: white;
  border: 2px solid rgba(20, 184, 166, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0d9488;
  flex-shrink: 0;
}
.dark .connector-arrow {
  background: #0f172a;
  border-color: rgba(45, 212, 191, 0.4);
  color: #2dd4bf;
}

/* Card image */
.card-img {
  width: 100%;
  height: 14rem;
  object-fit: cover;
  border-radius: 0.75rem 0.75rem 0 0;
  flex-shrink: 0;
}

/* Card body */
.card-body {
  padding: 1rem 1.25rem 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Card typography */
.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #115e59;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.dark .card-title {
  color: #5eead4;
}

.card-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  opacity: 0.7;
}
.dark .card-icon {
  opacity: 0.85;
}

.card-text {
  font-size: 0.8125rem;
  line-height: 1.55;
  color: #374151;
}
.dark .card-text {
  color: #d1d5db;
}

.card-link {
  font-weight: 500;
  text-decoration: underline;
  color: #0d9488;
  transition: color 0.2s ease;
}
.card-link:hover {
  color: #115e59;
}
.dark .card-link {
  color: #2dd4bf;
}
.dark .card-link:hover {
  color: #99f6e4;
}

/* === CTA bar === */
.cta-bar {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1.5rem;
}

.cta-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.06), rgba(20, 184, 166, 0.14));
  border: 1px solid rgba(20, 184, 166, 0.18);
  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}
.cta-inner:hover {
  box-shadow: 0 2px 20px rgba(20, 184, 166, 0.12);
  border-color: rgba(20, 184, 166, 0.3);
}
.dark .cta-inner {
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.08), rgba(45, 212, 191, 0.18));
  border-color: rgba(45, 212, 191, 0.2);
}
.dark .cta-inner:hover {
  box-shadow: 0 2px 20px rgba(45, 212, 191, 0.12);
  border-color: rgba(45, 212, 191, 0.35);
}

.cta-icon-lg {
  width: 1.125rem;
  height: 1.125rem;
  color: #0d9488;
  flex-shrink: 0;
}
.dark .cta-icon-lg {
  color: #2dd4bf;
}

.cta-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #115e59;
  white-space: nowrap;
}
.dark .cta-text {
  color: #5eead4;
}

.cta-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  background: #0d9488;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    transform 0.15s ease;
}
.cta-pill:hover {
  background: #0f766e;
  transform: translateY(-1px);
}
.dark .cta-pill {
  background: rgba(45, 212, 191, 0.2);
  color: #5eead4;
}
.dark .cta-pill:hover {
  background: rgba(45, 212, 191, 0.3);
}

.cta-arrow {
  width: 0.875rem;
  height: 0.875rem;
}

/* === Responsive: stack on small screens === */
@media (max-width: 768px) {
  .content-wrapper {
    flex: none;
    min-height: auto;
  }
  .cards-row {
    flex-direction: column;
    gap: 0.75rem;
  }
  .timeline-connector {
    display: none;
  }
  .card-img {
    height: 7rem;
    border-radius: 0.75rem 0.75rem 0 0;
  }
  .cta-inner {
    gap: 0.625rem;
    padding: 0.625rem 1.125rem;
  }
  .cta-bar {
    margin-top: 1rem;
    margin-bottom: 1.5rem;
  }
}
</style>
