<template>
  <div ref="rootRef" class="chatbot-root">
    <!-- Floating toggle button -->
    <button
      @click="toggle"
      class="chatbot-fab"
      :class="{ 'is-open': isOpen, 'is-new': !seen }"
      aria-label="Toggle terminal"
      :aria-expanded="isOpen ? 'true' : 'false'"
    >
      <!-- Pulses until the chat has been opened once this session -->
      <span class="fab-ring" aria-hidden="true"></span>
      <svg class="fab-icon fab-prompt" viewBox="0 0 24 24" aria-hidden="true">
        <path class="fab-chevron" d="M5.5 7.5 10 12l-4.5 4.5" />
        <rect class="fab-cursor" x="12.5" y="15.4" width="6.5" height="2.2" rx="1.1" />
      </svg>
      <svg class="fab-icon fab-close" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" />
      </svg>
      <span v-if="aiEnabled" class="fab-badge" aria-hidden="true">AI</span>
    </button>

    <!-- Terminal window -->
    <transition name="chat-slide">
      <div v-if="isOpen" class="chatbot-window" :class="{ 'riddle-active': riddleStep > 0 }">
        <!-- Title bar -->
        <div class="terminal-titlebar">
          <div class="titlebar-dots">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
          </div>
          <span class="titlebar-label">{{
            riddleStep > 0 ? '⚠ ROOT KIT DETECTED — CAUTION ⚠' : 'robbe@portfolio ~ chatbot'
          }}</span>
          <button @click="close" class="titlebar-close" aria-label="Close terminal">
            <X class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Terminal body -->
        <div ref="messagesContainer" class="terminal-body">
          <!-- Welcome banner -->
          <div class="terminal-banner">
            <pre class="banner-ascii">
  ██████╗  ██████╗ ██████╗ ██████╗ ███████╗
  ██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔════╝
  ██████╔╝██║   ██║██████╔╝██████╔╝█████╗  
  ██╔══██╗██║   ██║██╔══██╗██╔══██╗██╔══╝  
  ██║  ██║╚██████╔╝██████╔╝██████╔╝███████╗
  ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
            </pre>
            <p class="banner-subtitle">Portfolio Assistant v2.0 • Type 'help' for tips</p>
            <!-- AI disclosure (EU AI Act, Art. 50) and a pointer to the privacy page -->
            <p v-if="aiEnabled" class="banner-notice">
              {{ $t('chat.aiNotice') }}
              <router-link to="/privacy" class="banner-notice-link" @click="close">{{ $t('footer.privacy') }}</router-link>
            </p>
            <hr class="terminal-divider" />
          </div>

          <div v-for="(msg, i) in messages" :key="i">
            <!-- Bot message -->
            <div v-if="msg.actor === 'bot'" class="terminal-line bot-line">
              <span class="prompt-symbol bot-prompt">❯</span>
              <!-- AI replies are plain text (never v-html); the rest are translation keys -->
              <span class="line-text">{{ msg.text ?? $t(msg.key) }}</span>
            </div>
            <!-- User message -->
            <div v-else class="terminal-line user-line">
              <span class="prompt-symbol user-prompt">$</span>
              <span class="line-text user-text">{{ msg.key }}</span>
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="isTyping" class="terminal-line bot-line">
            <span class="prompt-symbol bot-prompt">❯</span>
            <span class="typing-cursor">▊</span>
          </div>

          <!-- Quick replies -->
          <div v-if="!isTyping && quickReplies.length" class="quick-replies-row">
            <button
              v-for="(qr, i) in quickReplies"
              :key="i"
              @click="sendQuickReply(qr)"
              class="quick-reply-chip"
            >
              {{ qr }}
            </button>
          </div>
        </div>

        <!-- Input line -->
        <div class="terminal-input-area">
          <span class="prompt-symbol input-prompt">❯</span>
          <label
            for="chat-input"
            class="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
            >{{ $t('chat.placeholder') }}</label
          >
          <input
            id="chat-input"
            ref="inputRef"
            v-model="input"
            type="text"
            maxlength="600"
            :placeholder="inputPlaceholder"
            class="terminal-input"
            @keyup.enter="send"
            spellcheck="false"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { ref, nextTick, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import { useEasterEgg } from '../composables/useEasterEgg'
import { askAssistant, type ChatTurn } from '../chatApi'
import { CHAT_API_URL } from '../site'

interface Message {
  actor: 'bot' | 'user'
  /** Translation key (bot) or what the visitor typed (user). */
  key: string
  /** An AI reply, shown as is. */
  text?: string
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
  // Specific project names → dedicated responses
  { keys: ['exulta'], responseKey: 'chat.project-exulta' },
  { keys: ['scan2talk', 'scan', 'qr'], responseKey: 'chat.project-scan2talk' },
  { keys: ['vhs', 'vhs service', 'paardenpistes', 'manegebodems'], responseKey: 'chat.project-vhs' },
  { keys: ['stal manager', 'stalmanager', 'stal', 'paardenkosten', 'horse costs'], responseKey: 'chat.project-stalmanager' },
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
  components: { X },
  setup() {
    const { t, locale } = useI18n({ useScope: 'global' })
    const {
      unlock,
      secretCode,
      clearSecretCode,
      close: closeEasterEgg,
      shouldResetChatbot,
    } = useEasterEgg()
    const isOpen = ref(false)
    const input = ref('')
    const isTyping = ref(false)
    const messages = ref<Message[]>([])
    const messagesContainer = ref<HTMLElement | null>(null)
    const inputRef = ref<HTMLInputElement | null>(null)
    const rootRef = ref<HTMLElement | null>(null)
    const riddleStep = ref(0) // 0 = not started, 1-3 = riddles
    const aiEnabled = !!CHAT_API_URL
    const SEEN_KEY = 'chat-seen'
    const seen = ref(true) // set on mount: sessionStorage is not there during prerender

    const inputPlaceholder = computed(() => t('chat.placeholder'))

    const quickReplies = computed(() => {
      const replies = t('chat.quickReplies') as unknown as string[]
      return Array.isArray(replies) ? replies : []
    })

    const scrollToBottom = () => {
      nextTick(() => {
        const el = messagesContainer.value
        if (el) el.scrollTop = el.scrollHeight
      })
    }

    const addMessage = (actor: 'bot' | 'user', keyOrText: string) => {
      messages.value.push({ actor, key: keyOrText })
      scrollToBottom()
    }

    const addReply = (text: string) => {
      messages.value.push({ actor: 'bot', key: '', text })
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

    const processMessage = async (userText: string) => {
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
        messages.value = []
        riddleStep.value = 0
        clearSecretCode()
        closeEasterEgg()
        addMessage('bot', 'chat.reset')
        return
      }

      // ── Easter egg riddle logic ──
      // Step 0: check if user typed a trigger word
      if (riddleStep.value === 0 && RIDDLE_TRIGGERS.some((k) => lower.includes(k))) {
        riddleStep.value = 1
        addMessage('bot', 'chat.easter.riddle1')
        return
      }

      // Steps 1 & 3: check against static answers
      if (riddleStep.value === 1 || riddleStep.value === 3) {
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
        const reply = await askAssistant(conversation(), locale.value === 'nl' ? 'nl' : 'en')
        if (reply) return addReply(reply)
      }
      addMessage('bot', responseKey ?? 'chat.fallback')
    }

    const send = () => {
      const text = input.value.trim()
      if (!text) return
      addMessage('user', text)
      input.value = ''
      isTyping.value = true
      scrollToBottom()
      setTimeout(
        async () => {
          await processMessage(text) // the typing cursor stays while the AI answers
          isTyping.value = false
        },
        600 + Math.random() * 800,
      )
    }

    const sendQuickReply = (text: string) => {
      addMessage('user', text)
      isTyping.value = true
      scrollToBottom()
      setTimeout(
        async () => {
          await processMessage(text)
          isTyping.value = false
        },
        400 + Math.random() * 600,
      )
    }

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

    const onClickOutside = (e: MouseEvent) => {
      const root = rootRef.value
      if (!root || !isOpen.value) return
      if (!root.contains(e.target as Node)) {
        close()
      }
    }

    watch(isOpen, (val) => {
      if (val) {
        // timeout skips the current click that opened the chatbot
        setTimeout(() => document.addEventListener('click', onClickOutside), 0)
      } else {
        document.removeEventListener('click', onClickOutside)
      }
    })

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

    onUnmounted(() => document.removeEventListener('click', onClickOutside))

    return {
      aiEnabled,
      seen,
      isOpen,
      input,
      isTyping,
      messages,
      messagesContainer,
      inputRef,
      rootRef,
      inputPlaceholder,
      quickReplies,
      send,
      sendQuickReply,
      toggle,
      open,
      close,
      riddleStep,
      close,
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
.banner-notice {
  margin: 0.5rem 0 0;
  font-size: 0.6875rem;
  line-height: 1.5;
  color: rgba(148, 163, 184, 0.9);
}
.banner-notice-link {
  color: #2dd4bf;
  text-decoration: underline;
  text-underline-offset: 2px;
}
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
.chatbot-fab:hover {
  border-color: #2dd4bf;
  box-shadow: 0 6px 26px rgba(20, 184, 166, 0.35);
  transform: translateY(-2px);
}
.chatbot-fab:active {
  transform: translateY(0) scale(0.96);
}
.chatbot-fab:focus-visible {
  outline: 2px solid #2dd4bf;
  outline-offset: 3px;
}
.dark .chatbot-fab {
  background: rgba(15, 23, 42, 0.95);
}

/* Icon: a drawn ">_" whose cursor blinks; it turns into an ✕ while open */
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
.fab-chevron {
  transition: transform 0.25s ease;
}
.chatbot-fab:hover .fab-chevron {
  transform: translateX(1.5px);
}
.fab-cursor {
  fill: currentColor;
  stroke: none;
  animation: fab-blink 1.1s step-end infinite;
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

/* Soft ping until the visitor has opened the chat once */
.fab-ring {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  border: 2px solid #2dd4bf;
  opacity: 0;
  pointer-events: none;
}
.chatbot-fab.is-new:not(.is-open) .fab-ring {
  animation: fab-ping 2.8s cubic-bezier(0, 0, 0.2, 1) 2s infinite;
}

.fab-badge {
  position: absolute;
  top: -0.45rem;
  right: -0.45rem;
  padding: 0.05rem 0.3rem;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  font-size: 0.5625rem;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.04em;
  color: #042f2e;
  background: #2dd4bf;
  border: 2px solid var(--color-bg, #0f172a);
  border-radius: 999px;
  transition:
    opacity 0.2s ease,
    transform 0.25s ease;
}
.chatbot-fab.is-open .fab-badge {
  opacity: 0;
  transform: scale(0.6);
}

@keyframes fab-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.6);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes fab-blink {
  50% {
    opacity: 0;
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
  .fab-cursor,
  .fab-ring {
    animation: none !important;
  }
  .fab-icon,
  .fab-chevron {
    transition: none;
  }
}

.dark .chatbot-fab {
  background: rgba(15, 23, 42, 0.95);
}

/* ── Terminal window ── */
.chatbot-window {
  position: absolute;
  bottom: 4rem;
  right: 0;
  width: 26rem;
  max-width: calc(100vw - 3rem);
  height: 30rem;
  max-height: calc(100vh - 8rem);
  background: #0c0c0d;
  border: 1px solid rgba(20, 184, 166, 0.25);
  border-radius: 0.5rem;
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(20, 184, 166, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Courier New', monospace;
}

/* ── Riddle-active easter egg mode ── */
.chatbot-window.riddle-active {
  border-color: rgba(251, 191, 36, 0.5);
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(251, 191, 36, 0.3),
    0 0 24px 4px rgba(251, 191, 36, 0.15);
  animation: riddle-glow 2s ease-in-out infinite alternate;
}
.chatbot-window.riddle-active .terminal-titlebar {
  background: #1e1a0f;
  border-bottom-color: rgba(251, 191, 36, 0.2);
}
.chatbot-window.riddle-active .titlebar-label {
  color: #fbbf24;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.chatbot-window.riddle-active .terminal-input-area {
  border-top-color: rgba(251, 191, 36, 0.2);
}
.chatbot-window.riddle-active .input-prompt {
  color: #fbbf24;
}
.chatbot-window.riddle-active .bot-prompt {
  color: #f59e0b;
}
.chatbot-window.riddle-active .bot-line .line-text {
  color: #fef3c7;
}

@keyframes riddle-glow {
  from {
    box-shadow:
      0 12px 48px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(251, 191, 36, 0.3),
      0 0 24px 4px rgba(251, 191, 36, 0.12);
  }
  to {
    box-shadow:
      0 12px 48px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(251, 191, 36, 0.45),
      0 0 32px 8px rgba(251, 191, 36, 0.22);
  }
}

/* ── Slide transition ── */
.chat-slide-enter-active {
  transition: all 0.28s cubic-bezier(0.34, 1.3, 0.64, 1);
}
.chat-slide-leave-active {
  transition: all 0.18s ease-in;
}
.chat-slide-enter-from {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.96);
}
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.98);
}

/* ── Title bar ── */
.terminal-titlebar {
  background: #1a1a1e;
  border-bottom: 1px solid rgba(20, 184, 166, 0.12);
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-shrink: 0;
  user-select: none;
}
.titlebar-dots {
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;
}
.dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
}
.dot-red {
  background: #ff5f57;
}
.dot-yellow {
  background: #febc2e;
}
.dot-green {
  background: #28c840;
}
.titlebar-label {
  font-size: 0.6875rem;
  color: #6b7280;
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.titlebar-close {
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.125rem;
  display: flex;
  border-radius: 0.25rem;
  transition: color 0.15s;
}
.titlebar-close:hover {
  color: #e5e7eb;
}

/* ── Banner ── */
.terminal-banner {
  margin-bottom: 0.75rem;
}
.banner-ascii {
  font-size: 0.43rem;
  line-height: 1.2;
  color: #14b8a6;
  opacity: 0.7;
  margin: 0 0 0.375rem 0;
  user-select: none;
}
.banner-subtitle {
  font-size: 0.6875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}
.terminal-divider {
  border: none;
  border-top: 1px dashed rgba(20, 184, 166, 0.15);
  margin: 0;
}

/* ── Message area ── */
.terminal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
}
.terminal-body::-webkit-scrollbar {
  width: 4px;
}
.terminal-body::-webkit-scrollbar-track {
  background: transparent;
}
.terminal-body::-webkit-scrollbar-thumb {
  background: rgba(20, 184, 166, 0.2);
  border-radius: 2px;
}

/* ── Terminal lines ── */
.terminal-line {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}
.prompt-symbol {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.8125rem;
  margin-top: 0.0625rem;
}
.bot-prompt {
  color: #14b8a6;
}
.user-prompt {
  color: #fbbf24;
}
.bot-line .line-text {
  color: #a5f3d0;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  word-break: break-word;
}
.user-line .line-text,
.user-text {
  color: #fde68a;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── Typing cursor ── */
.typing-cursor {
  color: #14b8a6;
  font-size: 0.875rem;
  animation: cursor-blink 1s step-end infinite;
}
@keyframes cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* ── Quick reply chips ── */
.quick-replies-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.375rem;
  margin-bottom: 0.25rem;
  padding-left: 1.25rem;
}
.quick-reply-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(20, 184, 166, 0.3);
  background: rgba(20, 184, 166, 0.06);
  color: #5eead4;
  font-size: 0.6875rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}
.quick-reply-chip:hover {
  background: rgba(20, 184, 166, 0.18);
  border-color: #2dd4bf;
  color: #99f6e4;
}

/* ── Input area ── */
.terminal-input-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-top: 1px solid rgba(20, 184, 166, 0.12);
  background: #0c0c0d;
  flex-shrink: 0;
}
.input-prompt {
  font-size: 0.875rem;
  font-weight: 700;
  color: #14b8a6;
  flex-shrink: 0;
}
.terminal-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #e2e8f0;
  font-size: 16px;
  font-family: inherit;
  caret-color: #14b8a6;
}
.terminal-input::placeholder {
  color: #4b5563;
}
.terminal-input::selection {
  background: rgba(20, 184, 166, 0.3);
}

@media (max-width: 480px) {
  .chatbot-root {
    bottom: 0.75rem;
    right: 0.5rem;
  }
  .chatbot-window {
    width: calc(100vw - 1rem);
    max-width: calc(100vw - 1rem);
    height: 22rem;
    max-height: 55vh;
    bottom: 3.5rem;
    right: 0;
    border-radius: 0.375rem;
  }
  .banner-ascii {
    font-size: 0.32rem;
  }
  .terminal-input-area {
    padding: 0.5rem 0.75rem;
  }
  .terminal-body {
    padding: 0.625rem 0.75rem;
  }
  .terminal-titlebar {
    padding: 0.375rem 0.625rem;
  }
}
</style>
