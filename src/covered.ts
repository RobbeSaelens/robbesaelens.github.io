import { computed, ref } from 'vue'

/**
 * Whether an opaque overlay hides the whole page: the lightbox, the mobile menu, the
 * easter egg. The animated effects behind it (the background, the hero name's sweep)
 * stop drawing while nobody can see them. Also the class `is-covered` on <html>.
 */
const open = ref(new Set<string>())

export const pageCovered = computed(() => open.value.size > 0)

/** `name` (the overlay) opens or closes. */
export function setCovering(name: string, on: boolean) {
  if (typeof document === 'undefined' || open.value.has(name) === on) return
  const next = new Set(open.value)
  if (on) next.add(name)
  else next.delete(name)
  open.value = next
  document.documentElement.classList.toggle('is-covered', next.size > 0)
}
