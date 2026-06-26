<template>
  <div ref="rootRef" class="chatbot-root">
    <!-- Floating toggle button -->
    <button @click="toggle" class="chatbot-fab" aria-label="Toggle terminal">
      <span class="fab-text">{{ isOpen ? '✕' : '&gt;_' }}</span>
    </button>

    <!-- Terminal window -->
    <transition name="chat-slide">
      <div v-if="isOpen" class="chatbot-window">
        <!-- Title bar -->
        <div class="terminal-titlebar">
          <div class="titlebar-dots">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
          </div>
          <span class="titlebar-label">robbe@portfolio ~ chatbot</span>
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
            <p class="banner-subtitle">Portfolio Assistant v1.0 • Type 'help' for tips</p>
            <hr class="terminal-divider" />
          </div>

          <div v-for="(msg, i) in messages" :key="i">
            <!-- Bot message -->
            <div v-if="msg.actor === 'bot'" class="terminal-line bot-line">
              <span class="prompt-symbol bot-prompt">❯</span>
              <span class="line-text">{{ $t(msg.key) }}</span>
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
          <input
            ref="inputRef"
            v-model="input"
            type="text"
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
import { ref, nextTick, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'

interface Message {
  actor: 'bot' | 'user'
  key: string
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
  { keys: ['stal manager', 'stalmanager'], responseKey: 'chat.project-stalmanager' },
  { keys: ['scan2talk', 'scan', 'qr'], responseKey: 'chat.project-scan2talk' },
  { keys: ['binance', 'crypto', 'smartwatch'], responseKey: 'chat.project-binance' },
  {
    keys: ['azure', 'netflix', 'opensearch', 'search app', 'thesis'],
    responseKey: 'chat.project-azure',
  },
  { keys: ['vital', 'vital cities', 'gatsby'], responseKey: 'chat.project-vital' },
  { keys: ['bikerental', 'bike rental', 'bike', 'nestjs'], responseKey: 'chat.project-bikerental' },
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
      'sport vlaanderen',
      'woumen',
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

export default {
  name: 'ChatBot',
  components: { X },
  setup() {
    const { t } = useI18n({ useScope: 'global' })
    const isOpen = ref(false)
    const input = ref('')
    const isTyping = ref(false)
    const messages = ref<Message[]>([])
    const messagesContainer = ref<HTMLElement | null>(null)
    const inputRef = ref<HTMLInputElement | null>(null)
    const rootRef = ref<HTMLElement | null>(null)

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

    const processMessage = (userText: string) => {
      const responseKey = findResponse(userText)
      if (responseKey) {
        addMessage('bot', responseKey)
      } else {
        addMessage('bot', 'chat.fallback')
      }
    }

    const send = () => {
      const text = input.value.trim()
      if (!text) return
      addMessage('user', text)
      input.value = ''
      isTyping.value = true
      scrollToBottom()
      setTimeout(
        () => {
          isTyping.value = false
          processMessage(text)
        },
        600 + Math.random() * 800,
      )
    }

    const sendQuickReply = (text: string) => {
      addMessage('user', text)
      isTyping.value = true
      scrollToBottom()
      setTimeout(
        () => {
          isTyping.value = false
          processMessage(text)
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

    onUnmounted(() => document.removeEventListener('click', onClickOutside))

    return {
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
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(20, 184, 166, 0.35);
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(8px);
  color: #14b8a6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
}
.chatbot-fab:hover {
  border-color: #2dd4bf;
  box-shadow: 0 4px 24px rgba(20, 184, 166, 0.25);
  transform: translateY(-2px);
}
.chatbot-fab:active {
  transform: translateY(0);
}
.fab-text {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1;
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
  font-size: 0.8125rem;
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
    right: 0;
    border-radius: 0.375rem;
  }
  .banner-ascii {
    font-size: 0.34rem;
  }
}
</style>
