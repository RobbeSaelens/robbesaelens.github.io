import { CHAT_API_URL } from './site'

/**
 * Client for the chatbot's AI (the status-worker Cloudflare Worker, POST /chat).
 * Returns null whenever there is no AI answer, so the chatbot falls back to its
 * built-in answers: not configured, offline, rate limited, quota used up, timeout.
 */

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

const MAX_TURNS = 10
const MAX_CHARS = 600
const TIMEOUT_MS = 15_000

// After a 429 or 503, don't ask again for a while; the built-in answers cover it.
let pausedUntil = 0

export async function askAssistant(turns: ChatTurn[], lang: 'en' | 'nl'): Promise<string | null> {
  if (!CHAT_API_URL || Date.now() < pausedUntil) return null
  const messages = turns
    .slice(-MAX_TURNS)
    .map((t) => ({ role: t.role, content: t.content.trim().slice(0, MAX_CHARS) }))
    .filter((t) => t.content)
  if (messages.at(-1)?.role !== 'user') return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${CHAT_API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, lang }),
      signal: controller.signal,
    })
    if (res.status === 429) pausedUntil = Date.now() + 60_000
    if (res.status === 503) pausedUntil = Date.now() + 5 * 60_000
    if (!res.ok) return null
    const body = (await res.json()) as { reply?: unknown }
    return typeof body.reply === 'string' && body.reply.trim() ? body.reply.trim() : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
