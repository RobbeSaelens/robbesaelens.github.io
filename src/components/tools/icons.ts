/**
 * The lucide icon for each `ToolIcon` name in src/tools.ts: the points under a chapter's
 * sentence (Tools.vue) and the apps in Sift's story (SiftStory.vue) use the same ones.
 */
import type { Component } from 'vue'
import {
  Bot,
  Columns2,
  Eye,
  FileDiff,
  GitBranch,
  ListChecks,
  ScanSearch,
  Sparkles,
  SquarePlus,
  SquareTerminal,
  Timer,
} from 'lucide-vue-next'
import type { ToolIcon } from '../../tools'

export const TOOL_ICONS: Record<ToolIcon, Component> = {
  scan: ScanSearch,
  bot: Bot,
  checks: ListChecks,
  review: Eye,
  diff: Columns2,
  stage: SquarePlus,
  branches: GitBranch,
  ai: Sparkles,
  teamwork: Timer,
  terminal: SquareTerminal,
  ide: FileDiff,
}
