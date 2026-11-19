<template>
  <div ref="rootRef" class="chatbot-root">
    <!-- Leans towards the mouse, 8px at most: it sits in the corner, 16px from the footer's
         contact links (AppFooter.vue). Holds still while open. -->
    <ButtonMagnet :padding="16" :strength="5" :disabled="isOpen">
      <button
        ref="fabRef"
        @click="toggle"
        class="chatbot-fab"
        :class="{ 'is-open': isOpen, 'is-new': !seen }"
        :aria-label="isOpen ? $t(aiEnabled ? 'chat.close' : 'chat.closeBasic') : $t(aiEnabled ? 'chat.open' : 'chat.openBasic')"
        :aria-expanded="isOpen ? 'true' : 'false'"
      >
        <!-- Pings three times, until the chat has been opened once this session -->
        <span class="fab-ring" aria-hidden="true"></span>
        <MessageCircle class="fab-icon fab-prompt fab-chat" aria-hidden="true" />
        <svg class="fab-icon fab-close" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
        </svg>
      </button>
    </ButtonMagnet>

    <transition name="chat-slide">
      <section
        v-if="isOpen"
        class="chatbot-window"
        :class="{ 'riddle-active': riddleStep > 0 }"
        :aria-label="$t(aiEnabled ? 'chat.title' : 'chat.titleBasic')"
      >
        <header class="chat-head">
          <span class="chat-avatar" aria-hidden="true"><LlamaIcon /></span>
          <div class="chat-head-text">
            <p class="chat-title">
              {{ riddleStep > 0 ? '⚠ ROOT KIT DETECTED' : $t(aiEnabled ? 'chat.title' : 'chat.titleBasic') }}
            </p>
            <p class="chat-sub">
              <span class="chat-status" :class="aiOnline ? 'is-on' : 'is-off'" aria-hidden="true"></span>
              <span class="chat-sub-text">{{ aiOnline ? 'Llama 3.3 · Cloudflare Workers AI' : $t('chat.offline') }}</span>
            </p>
          </div>
          <button type="button" class="chat-icon-btn" :aria-label="$t('chat.clear')" :title="$t('chat.clear')" @click="clearChat">
            <RotateCcw />
          </button>
          <button type="button" class="chat-icon-btn" :aria-label="$t(aiEnabled ? 'chat.close' : 'chat.closeBasic')" @click="close">
            <X />
          </button>
        </header>

        <div ref="messagesContainer" class="chat-body" aria-live="polite">
          <!-- AI disclosure (EU AI Act, Art. 50) and a pointer to the privacy page -->
          <p v-if="aiEnabled" class="chat-notice">
            {{ $t('chat.aiNotice') }}
            <router-link :to="$lp('/privacy')" class="chat-notice-link" @click="close">{{ $t('footer.privacy') }}</router-link>
          </p>

          <div v-for="(msg, i) in messages" :key="i" class="msg" :class="`msg--${msg.actor}`">
            <span v-if="msg.actor === 'bot'" class="msg-avatar" aria-hidden="true"><LlamaIcon /></span>
            <!-- AI replies are plain text (never v-html); the rest are translation keys.
                 An answer to a question opens with the thinking line, done: a check and the time. -->
            <p class="msg-text"><span v-if="msg.took != null" class="msg-status msg-status--done" aria-hidden="true"
                ><ChatThinking :took="msg.took" :animate="i === messages.length - 1" :riddle="riddleStep > 0" /></span
              >{{ msg.actor === 'user' ? msg.key : (msg.text ?? $t(msg.key)) }}</p>
          </div>

          <!-- Thinking: pulsing dots and a timer (ChatThinking.vue) -->
          <div v-if="isTyping" class="msg msg--bot chat-typing" aria-hidden="true">
            <span class="msg-avatar"><LlamaIcon /></span>
            <p class="msg-text"><span class="msg-status"><ChatThinking :riddle="riddleStep > 0" /></span></p>
          </div>

          <!-- Follow-ups after an AI answer; the starter questions at the beginning -->
          <ul v-if="!isTyping && chips.length" class="chat-chips" :aria-label="$t('chat.suggestions')">
            <li v-for="(chip, i) in chips" :key="i">
              <button type="button" class="chat-chip" @click="sendQuickReply(chip)">{{ chip }}</button>
            </li>
          </ul>
        </div>

        <form class="chat-input" @submit.prevent="send">
          <label for="chat-input" class="sr-only">{{ $t('chat.placeholder') }}</label>
          <input
            id="chat-input"
            ref="inputRef"
            v-model="input"
            type="text"
            maxlength="600"
            autocomplete="off"
            spellcheck="false"
            :placeholder="inputPlaceholder"
          />
          <button type="submit" class="chat-send" :aria-label="$t('chat.send')" :disabled="!input.trim() || pending">
            <ArrowUp />
          </button>
        </form>
      </section>
    </transition>
  </div>
</template>

<script lang="ts">
import { ref, nextTick, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUp, MessageCircle, RotateCcw, X } from 'lucide-vue-next'
import ButtonMagnet from './ButtonMagnet.vue'
import ChatThinking from './ChatThinking.vue'
import LlamaIcon from './LlamaIcon.vue'
import { useEasterEgg } from '../composables/useEasterEgg'
import { aiAvailable, askAssistant, type ChatTurn } from '../chatApi'
import { CHAT_API_URL } from '../site'

interface Message {
  actor: 'bot' | 'user'
  /** Translation key (bot) or what the visitor typed (user). */
  key: string
  /** An AI reply, shown as is. */
  text?: string
  /** Follow-up questions offered with an AI reply. */
  suggestions?: string[]
  /** An answer to a question: the seconds it took, shown above it. */
  took?: number
}

const KEYWORDS: { keys: string[]; responseKey: string }[] = [
  {
    keys: ['hi', 'hello', 'hey', 'hoi', 'hallo', 'yo', 'good morning', 'good evening'],
    responseKey: 'chat.greeting',
  },
  {
    keys: [
      'skills',
      'skill',
      'tech',
      'stack',
      'technologie',
      'vaardigheden',
      'kunnen',
      'know',
      'can do',
    ],
    responseKey: 'chat.skills',
  },
  // The tools he built to keep his projects up to date (the tools page). Before the
  // projects: "project updater" holds "project", and "scans" holds "scan" (Scan2Talk).
  {
    keys: [
      'sift',
      'project updater',
      'project-updater',
      'updater',
      'tools',
      'tool',
      'git client',
      'phpstorm',
      'sublime',
      'maintain',
      'onderhou',
      'up to date',
      'up-to-date',
      'bijhoud',
    ],
    responseKey: 'chat.tools',
  },
  // Specific project names → dedicated responses
  { keys: ['exulta'], responseKey: 'chat.project-exulta' },
  { keys: ['scan2talk', 'scan', 'qr'], responseKey: 'chat.project-scan2talk' },
  { keys: ['vhs', 'vhs service', 'paardenpistes', 'manegebodems'], responseKey: 'chat.project-vhs' },
  // Shared Costs is the Drupal version of Stable Manager: its answer covers both
  {
    keys: [
      'stable manager',
      'stablemanager',
      'stable',
      // Its old name, Stal Manager, still finds it ("stal" is also Dutch for stable)
      'stal manager',
      'stalmanager',
      'stal',
      'paardenkosten',
      'horse costs',
      'shared cost',
      'shared_costs',
      'sharedcosts',
      'gedeelde kosten',
      'drupal module',
      'drupal-module',
      'recipe',
    ],
    responseKey: 'chat.project-stablemanager',
  },
  // Work on drupal.org; "drupal module" is answered above, with Shared Costs
  {
    keys: ['drupal.org', 'contribut', 'bijdrage', 'credit', 'merge request', 'drupal'],
    responseKey: 'chat.drupal',
  },
  // General projects
  {
    keys: ['project', 'projects', 'projecten', 'built', 'made', 'gemaakt', 'portfolio'],
    responseKey: 'chat.projects',
  },
  {
    keys: [
      'contact',
      'email',
      'mail',
      'phone',
      'telefoon',
      'bereiken',
      'reach',
      'message',
      'linkedin',
    ],
    responseKey: 'chat.contact',
  },
  {
    keys: [
      'experience',
      'work',
      'job',
      'ervaring',
      'gewerkt',
      'dynamate',
      'intern',
      'stage',
      'your mind',
    ],
    responseKey: 'chat.experience',
  },
  {
    keys: [
      'education',
      'school',
      'study',
      'studies',
      'opleiding',
      'gestudeerd',
      'howest',
      'mct',
      'bachelor',
      'degree',
      'diploma',
      'mit',
    ],
    responseKey: 'chat.education',
  },
  {
    keys: ['where', 'location', 'geluwe', 'gilwe', 'belgium', 'belgie', 'woon', 'live', 'based'],
    responseKey: 'chat.location',
  },
  {
    keys: [
      'horse',
      'paard',
      'equestrian',
      'riding',
      'instructor',
      'instructeur',
      'hobby',
      'teaching',
    ],
    responseKey: 'chat.hobbies',
  },
  {
    keys: ['about', 'who', 'wie', 'over', 'vertel', 'tell', 'jezelf', 'yourself'],
    responseKey: 'chat.about',
  },
  { keys: ['help', 'commands', 'opties'], responseKey: 'chat.help' },
  { keys: ['thanks', 'thank', 'thx', 'dank', 'bedankt', 'merci'], responseKey: 'chat.thanks' },
  { keys: ['bye', 'doei', 'ciao', 'later', 'see you'], responseKey: 'chat.bye' },
]

function findResponse(input: string): string | null {
  const lower = input.toLowerCase().trim()
  for (const entry of KEYWORDS) {
    if (entry.keys.some((k) => lower.includes(k))) {
      return entry.responseKey
    }
  }
  return null
}

// Easter egg riddle constants
const RIDDLE_TRIGGERS = [
  'sudo',
  'root',
  'admin',
  'secret',
  'geheim',
  'easter egg',
  'hidden',
  'hack',
]
const RIDDLE_ANSWERS: Record<number, string[]> = {
  1: ['hypertext markup language', 'hyper text markup language'],
  3: ['playwright'],
}

export default {
  name: 'ChatBot',
  components: { ArrowUp, ButtonMagnet, ChatThinking, LlamaIcon, MessageCircle, RotateCcw, X },
  setup() {
    const { t, tm, rt, locale } = useI18n({ useScope: 'global' })
    const { unlock, secretCode, clearSecretCode, isEasterEggUnlocked, shouldResetChatbot } = useEasterEgg()
    const isOpen = ref(false)
    const input = ref('')
    const isTyping = ref(false)
    /** An answer is being worked out; a new message waits until it's there. */
    const pending = ref(false)
    const messages = ref<Message[]>([])
    const messagesContainer = ref<HTMLElement | null>(null)
    const inputRef = ref<HTMLInputElement | null>(null)
    const rootRef = ref<HTMLElement | null>(null)
    const fabRef = ref<HTMLElement | null>(null)
    const riddleStep = ref(0) // 0 = not started, 1-3 = riddles
    const aiEnabled = !!CHAT_API_URL
    const SEEN_KEY = 'chat-seen'
    const seen = ref(true) // set on mount: sessionStorage is not there during prerender

    const inputPlaceholder = computed(() => t('chat.placeholder'))

    // tm() returns the list itself (t() only resolves single messages)
    const quickReplies = computed(() => {
      const replies = tm('chat.quickReplies') as unknown
      return Array.isArray(replies) ? replies.map((r) => rt(r)) : []
    })

    const aiOnline = computed(() => aiEnabled && aiAvailable.value)

    /** Follow-ups of the last AI answer; the starter questions until the visitor has asked something. */
    const chips = computed(() => {
      const last = messages.value.at(-1)
      if (last?.actor === 'bot' && last.suggestions?.length) return last.suggestions
      return messages.value.some((m) => m.actor === 'user') ? [] : quickReplies.value
    })

    const scrollToBottom = () => {
      nextTick(() => {
        const el = messagesContainer.value
        if (el) el.scrollTop = el.scrollHeight
      })
    }

    /** When the question being answered was asked (performance.now()). */
    let askedAt: number | null = null

    /** For the first bot line after a question: the seconds since it was asked. */
    const took = (actor: 'bot' | 'user') => {
      if (actor !== 'bot' || askedAt === null) return undefined
      const seconds = (performance.now() - askedAt) / 1000
      askedAt = null
      return seconds
    }

    const addMessage = (actor: 'bot' | 'user', keyOrText: string) => {
      messages.value.push({ actor, key: keyOrText, took: took(actor) })
      scrollToBottom()
    }

    const addReply = (text: string, suggestions: string[] = []) => {
      messages.value.push({ actor: 'bot', key: '', text, suggestions, took: took('bot') })
      scrollToBottom()
    }

    /**
     * The conversation as the AI sees it, up to the visitor's last message (the
     * welcome line can land after a quick first question). Bot lines are sent in
     * the visitor's language.
     */
    const conversation = (): ChatTurn[] => {
      const lastUser = messages.value.map((m) => m.actor).lastIndexOf('user')
      return messages.value
        .slice(0, lastUser + 1)
        .map((m) =>
          m.actor === 'user'
            ? { role: 'user', content: m.key }
            : { role: 'assistant', content: m.text ?? t(m.key) },
        )
    }

    /**
     * Works out the answer and shows it, no sooner than `ready` (the thinking time). The
     * AI is asked right away, so its answer takes as long as the thinking time or the
     * network, whichever is longer, not the two added up.
     */
    const processMessage = async (userText: string, ready: Promise<unknown>) => {
      const lower = userText.toLowerCase().trim()

      // ── Terminal reset / clear ──
      const RESET_COMMANDS = [
        'exit',
        'clear',
        'cls',
        'reset',
        'start over',
        'ctrl c',
        'cmd c',
        'ctrl+c',
        'cmd+c',
      ]
      if (RESET_COMMANDS.some((cmd) => lower === cmd)) {
        await ready
        return startOver('chat.reset')
      }

      // ── Easter egg riddle logic ──
      // Step 0: check if user typed a trigger word
      if (riddleStep.value === 0 && RIDDLE_TRIGGERS.some((k) => lower.includes(k))) {
        await ready
        riddleStep.value = 1
        addMessage('bot', 'chat.easter.riddle1')
        return
      }

      // Steps 1 & 3: check against static answers
      if (riddleStep.value === 1 || riddleStep.value === 3) {
        await ready
        const answers = RIDDLE_ANSWERS[riddleStep.value]
        if (answers && answers.some((a) => lower.replace(/\s/g, '') === a.replace(/\s/g, ''))) {
          riddleStep.value++
          if (riddleStep.value > 3) {
            addMessage('bot', 'chat.easter.unlock')
            setTimeout(() => unlock(), 1200)
          } else {
            const nextKey = `chat.easter.riddle${riddleStep.value}`
            addMessage('bot', nextKey)
          }
          return
        }
        addMessage('bot', 'chat.easter.wrong')
        return
      }

      // Step 2: check against the dynamic secret code from logo triple-click
      if (riddleStep.value === 2) {
        await ready
        if (secretCode.value && lower === secretCode.value) {
          riddleStep.value = 3
          clearSecretCode()
          addMessage('bot', 'chat.easter.riddle3')
          return
        }
        if (!secretCode.value) {
          addMessage('bot', 'chat.easter.no_code')
        } else {
          addMessage('bot', 'chat.easter.wrong_code')
        }
        return
      }

      // ── Normal message processing ──
      const responseKey = findResponse(userText)
      // "help" lists the built-in topics; everything else goes to the AI first.
      if (responseKey !== 'chat.help') {
        const answer = await askAssistant(conversation(), locale.value === 'nl' ? 'nl' : 'en')
        await ready
        if (answer) return addReply(answer.reply, answer.suggestions)
      }
      await ready
      addMessage('bot', responseKey ?? 'chat.fallback')
    }

    /**
     * Shows the question, then the thinking line until the answer is there: at least
     * `delay` ms (a built-in answer would otherwise flash in), longer while the AI works.
     */
    const ask = (text: string, delay: number) => {
      if (pending.value) return
      pending.value = true
      addMessage('user', text)
      askedAt = performance.now()
      isTyping.value = true
      scrollToBottom()
      const ready = new Promise((resolve) => setTimeout(resolve, delay))
      void processMessage(text, ready).finally(() => {
        isTyping.value = false
        pending.value = false
      })
    }

    const send = () => {
      const text = input.value.trim()
      if (!text || pending.value) return
      input.value = ''
      ask(text, 600 + Math.random() * 800)
    }

    const sendQuickReply = (text: string) => ask(text, 400 + Math.random() * 600)

    const toggle = () => {
      if (isOpen.value) {
        close()
      } else {
        open()
      }
    }

    const open = () => {
      isOpen.value = true
      if (!seen.value) {
        seen.value = true
        try {
          sessionStorage.setItem(SEEN_KEY, '1')
        } catch {
          // only this page view then
        }
      }
      if (messages.value.length === 0) {
        isTyping.value = true
        setTimeout(() => {
          isTyping.value = false
          addMessage('bot', 'chat.welcome')
        }, 600)
      }
      // On touch devices, defer focus to avoid auto-opening the keyboard
      if (!('ontouchstart' in window)) {
        nextTick(() => inputRef.value?.focus())
      }
    }

    const close = () => {
      isOpen.value = false
    }

    /**
     * Empties the chat and leaves the riddle. Hides the easter egg directly: its
     * own close() also signals shouldResetChatbot, which would wipe `firstLine`.
     */
    const startOver = (firstLine: string) => {
      messages.value = []
      riddleStep.value = 0
      clearSecretCode()
      isEasterEggUnlocked.value = false
      askedAt = null // a fresh start, not an answer
      addMessage('bot', firstLine)
    }

    const clearChat = () => {
      startOver('chat.welcome')
      nextTick(() => inputRef.value?.focus())
    }

    const onClickOutside = (e: MouseEvent) => {
      const root = rootRef.value
      if (!root || !isOpen.value) return
      // The path as it was when clicked: a chip removes itself from the page
      // (the answer replaces it) before the click gets here.
      if (!e.composedPath().includes(root)) close()
    }

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isOpen.value) return
      close()
      fabRef.value?.focus()
    }

    watch(isOpen, (val) => {
      if (val) {
        // timeout skips the current click that opened the chatbot
        setTimeout(() => document.addEventListener('click', onClickOutside), 0)
        document.addEventListener('keydown', onKeydown)
      } else {
        document.removeEventListener('click', onClickOutside)
        document.removeEventListener('keydown', onKeydown)
      }
    })

    // The chips appear only once the thinking line is gone, after the answer
    // itself was scrolled to: scroll again so they aren't cut off.
    watch(() => [chips.value, isTyping.value], scrollToBottom)

    watch(shouldResetChatbot, (val) => {
      if (val) {
        messages.value = []
        riddleStep.value = 0
        clearSecretCode()
        shouldResetChatbot.value = false
      }
    })

    onMounted(() => {
      try {
        seen.value = sessionStorage.getItem(SEEN_KEY) === '1'
      } catch {
        seen.value = false
      }
    })

    onUnmounted(() => {
      document.removeEventListener('click', onClickOutside)
      document.removeEventListener('keydown', onKeydown)
    })

    return {
      aiEnabled,
      aiOnline,
      pending,
      chips,
      clearChat,
      seen,
      isOpen,
      input,
      isTyping,
      messages,
      messagesContainer,
      inputRef,
      rootRef,
      fabRef,
      inputPlaceholder,
      send,
      sendQuickReply,
      toggle,
      open,
      close,
      riddleStep,
    }
  },
}
</script>

<style>
/* ── Root container: fixed bottom-right corner ── */
.chatbot-root {
  position: fixed;
  bottom: 1.25rem;
  right: 1.5rem;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
}

/* ── FAB button ── */
.chatbot-fab {
  position: relative;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(20, 184, 166, 0.35);
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(8px);
  color: #2dd4bf;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.2s ease,
    box-shadow 0.25s ease;
  animation: fab-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.9s backwards; /* no end state: keeps :hover working */
}
/* Hover only with a mouse: on a touch screen it would stick after the tap */
@media (hover: hover) and (pointer: fine) {
  .chatbot-fab:hover {
    border-color: #2dd4bf;
    box-shadow: 0 6px 26px rgba(20, 184, 166, 0.35);
    transform: translateY(-2px);
  }
}
/* The press snaps (0.12s), like the other buttons; the hover lift above eases */
.chatbot-fab:active {
  transform: translateY(0) scale(0.97);
  transition-duration: 0.12s, 0.2s, 0.25s;
}
.chatbot-fab:focus-visible {
  outline: 2px solid #2dd4bf;
  outline-offset: 3px;
}
.dark .chatbot-fab {
  background: rgba(15, 23, 42, 0.95);
}

/* Icon: a chat bubble; it turns into an ✕ while open */
.fab-icon {
  position: absolute;
  width: 1.5rem;
  height: 1.5rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition:
    opacity 0.25s ease,
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
/* A lighter line than the ✕, and a small tilt on hover */
.fab-chat {
  width: 1.65rem;
  height: 1.65rem;
  stroke-width: 2;
}
@media (hover: hover) and (pointer: fine) {
  .chatbot-fab:hover .fab-chat {
    transform: rotate(-8deg) scale(1.06);
  }
  .chatbot-fab.is-open:hover .fab-chat {
    transform: rotate(90deg) scale(0.6);
  }
}
.fab-close {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}
.chatbot-fab.is-open .fab-prompt {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}
.chatbot-fab.is-open .fab-close {
  opacity: 1;
  transform: none;
}

/* A soft ping, three times (then it rests), until the visitor has opened the chat once */
.fab-ring {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  border: 2px solid #2dd4bf;
  opacity: 0;
  pointer-events: none;
}
.chatbot-fab.is-new:not(.is-open) .fab-ring {
  animation: fab-ping 2.8s cubic-bezier(0, 0, 0.2, 1) 2s 3;
}

@keyframes fab-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes fab-ping {
  0% {
    opacity: 0.7;
    transform: scale(1);
  }
  70%,
  100% {
    opacity: 0;
    transform: scale(1.45);
  }
}
@media (prefers-reduced-motion: reduce) {
  .chatbot-fab,
  .fab-ring {
    animation: none !important;
  }
  .fab-icon {
    transition: none;
  }
}

.dark .chatbot-fab {
  background: rgba(15, 23, 42, 0.95);
}

/* ── Window ── */
.chatbot-window {
  position: absolute;
  bottom: 4rem;
  right: 0;
  display: flex;
  flex-direction: column;
  width: 25rem;
  max-width: calc(100vw - 3rem);
  height: min(34rem, calc(100vh - 8rem));
  height: min(34rem, calc(100dvh - 8rem));
  overflow: hidden;
  color: #e2e8f0;
  background: #0d1117;
  border: 1px solid rgba(45, 212, 191, 0.25);
  border-radius: 1rem;
  box-shadow:
    0 18px 50px -12px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(45, 212, 191, 0.06);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

/* Phones: a sheet over the bottom of the screen */
@media (max-width: 639px) {
  .chatbot-window {
    position: fixed;
    left: 0.75rem;
    right: 0.75rem;
    bottom: 5rem;
    width: auto;
    max-width: none;
    height: min(75vh, 36rem);
    height: min(75dvh, 36rem);
  }
}

/* ── Header ── */
.chat-head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.14), rgba(45, 212, 191, 0.02) 70%);
  border-bottom: 1px solid rgba(45, 212, 191, 0.14);
}
.chat-avatar {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0.3rem;
  border-radius: 0.65rem;
  color: #042f2e;
  background: #2dd4bf;
}
.chat-head-text {
  flex: 1;
  min-width: 0;
}
.chat-title {
  margin: 0;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #f1f5f9;
}
.chat-sub {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.1rem 0 0;
  overflow: hidden;
  font-size: 0.6875rem;
  color: #a7b4c4;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.chat-sub-text {
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-status {
  flex-shrink: 0;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
}
.chat-status.is-on {
  background: #4ade80;
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.18);
}
.chat-status.is-off {
  background: #fbbf24;
}
.chat-icon-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0.45rem;
  border: 0;
  border-radius: 0.5rem;
  color: #a7b4c4;
  background: transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease;
}
@media (hover: hover) and (pointer: fine) {
  .chat-icon-btn:hover {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.08);
  }
}
.chat-icon-btn:active {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.12);
}
/* Touch: 44px targets for clear and close */
@media (pointer: coarse) {
  .chat-icon-btn {
    width: 2.75rem;
    height: 2.75rem;
    padding: 0.65rem;
  }
}
.chat-icon-btn svg {
  width: 100%;
  height: 100%;
}

/* ── Messages ── */
.chat-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem 0.9rem 0.6rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(45, 212, 191, 0.25) transparent;
}
.chat-notice {
  margin: 0;
  padding: 0.55rem 0.7rem;
  font-size: 0.6875rem;
  line-height: 1.5;
  color: #a7b4c4;
  background: rgba(148, 163, 184, 0.08);
  border-radius: 0.6rem;
}
.chat-notice-link {
  color: #5eead4;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.msg {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  max-width: 92%;
  animation: msg-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.msg--user {
  align-self: flex-end;
}
.msg-avatar {
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0.2rem;
  border-radius: 0.5rem;
  color: #5eead4;
  background: rgba(45, 212, 191, 0.12);
}
.msg-text {
  margin: 0;
  padding: 0.55rem 0.8rem;
  font-size: 0.85rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  border-radius: 0.9rem;
}
.msg--bot .msg-text {
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.1);
  border-bottom-left-radius: 0.3rem;
}
.msg--user .msg-text {
  color: #042f2e;
  background: #5eead4;
  border-bottom-right-radius: 0.3rem;
}

/* The thinking line (ChatThinking.vue): alone in the typing row, then on top of
   the answer, in the same spot, so the dots seem to settle into the check. */
.msg-status {
  display: flex;
  align-items: center;
  min-height: 1.35rem;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
}
.msg-status--done {
  margin-bottom: 0.3rem;
}

/* ── Suggested questions ── */
.chat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.1rem 0 0 2.1rem;
  padding: 0;
  list-style: none;
}
.chat-chip {
  padding: 0.35rem 0.7rem;
  font: inherit;
  font-size: 0.75rem;
  text-align: left;
  color: #5eead4;
  background: rgba(45, 212, 191, 0.08);
  border: 1px solid rgba(45, 212, 191, 0.3);
  border-radius: 999px;
  cursor: pointer;
  animation: msg-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}
@media (hover: hover) and (pointer: fine) {
  .chat-chip:hover {
    background: rgba(45, 212, 191, 0.16);
    border-color: #5eead4;
  }
}
.chat-chip:active {
  background: rgba(45, 212, 191, 0.16);
}

/* ── Input ── */
.chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  border-top: 1px solid rgba(45, 212, 191, 0.14);
}
.chat-input input {
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.8rem;
  font: inherit;
  font-size: 0.875rem;
  color: #f1f5f9;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 0.65rem;
  caret-color: #2dd4bf;
}
/* Touch: 16px, or iOS zooms the page in when the field gets focus */
@media (pointer: coarse) {
  .chat-input input {
    font-size: 1rem;
  }
}
.chat-input input::placeholder {
  color: #8a97a8;
}
.chat-input input:focus {
  outline: none;
  border-color: rgba(45, 212, 191, 0.6);
}
.chat-send {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  padding: 0.55rem;
  border: 0;
  border-radius: 0.65rem;
  color: #042f2e;
  background: #2dd4bf;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    background 0.2s ease;
}
@media (hover: hover) and (pointer: fine) {
  .chat-send:hover:not(:disabled) {
    background: #5eead4;
  }
}
.chat-send:active:not(:disabled) {
  background: #5eead4;
}
.chat-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.chat-send svg {
  width: 100%;
  height: 100%;
}
.chat-icon-btn:focus-visible,
.chat-chip:focus-visible,
.chat-send:focus-visible,
.chat-notice-link:focus-visible {
  outline: 2px solid #5eead4;
  outline-offset: 2px;
}

/* ── Riddle (easter egg) mode ── */
.chatbot-window.riddle-active {
  border-color: rgba(251, 191, 36, 0.5);
  animation: riddle-glow 2s ease-in-out infinite alternate;
}
.chatbot-window.riddle-active .chat-head {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.16), rgba(251, 191, 36, 0.02) 70%);
  border-bottom-color: rgba(251, 191, 36, 0.2);
}
.chatbot-window.riddle-active .chat-title {
  color: #fbbf24;
  letter-spacing: 0.05em;
}
.chatbot-window.riddle-active .chat-avatar {
  background: #fbbf24;
}
.chatbot-window.riddle-active .msg--bot .msg-text {
  color: #fef3c7;
  background: rgba(251, 191, 36, 0.1);
}
.chatbot-window.riddle-active .chat-input {
  border-top-color: rgba(251, 191, 36, 0.2);
}
@keyframes riddle-glow {
  from {
    box-shadow:
      0 18px 50px -12px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(251, 191, 36, 0.3),
      0 0 24px 4px rgba(251, 191, 36, 0.12);
  }
  to {
    box-shadow:
      0 18px 50px -12px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(251, 191, 36, 0.45),
      0 0 32px 8px rgba(251, 191, 36, 0.22);
  }
}

/* ── Animations ── */
.chat-slide-enter-active {
  transition:
    opacity 0.28s ease,
    transform 0.32s cubic-bezier(0.34, 1.3, 0.64, 1);
  transform-origin: bottom right;
}
.chat-slide-leave-active {
  /* Out fast and decelerating (ease-in would hold it on screen for its first half) */
  transition:
    opacity 0.18s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: bottom right;
}
.chat-slide-enter-from {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.94);
}
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.97);
}
@keyframes msg-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .msg,
  .chat-chip,
  .chatbot-window.riddle-active {
    animation: none;
  }
  .chat-slide-enter-active,
  .chat-slide-leave-active {
    transition: none;
  }
}
</style>
