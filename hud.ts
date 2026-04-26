// hud.ts
// ALL display writes go through this file — never call bridge directly from other modules
// Ghost-char safe: every write pads to full line width

import { TextContainerUpgrade } from '@evenrealities/even_hub_sdk'

const CONTAINER_ID = 1
const LINE_WIDTH = 22       // FOV-safe max chars per line
let clearTimer: ReturnType<typeof setTimeout> | null = null
let bridge: any = null

export function initHud(appBridge: any) {
  bridge = appBridge
}

// Pad a single line to LINE_WIDTH to kill ghost characters
function pad(text: string): string {
  return text.substring(0, LINE_WIDTH).padEnd(LINE_WIDTH, ' ')
}

// Write suggestion to HUD — auto-clears after 8 seconds
export async function hudWrite(suggestion: string) {
  if (!bridge) return
  cancelAutoClear()

  const line = pad(`Say: ${suggestion}`)

  await bridge.textContainerUpgrade(new TextContainerUpgrade({
    containerID: CONTAINER_ID,
    content: line,
  }))

  // Auto-clear after 8s — suggestion was used or ignored
  clearTimer = setTimeout(() => hudClear(), 8000)
}

// Write a status message (e.g. "Listening...")
export async function hudStatus(msg: string) {
  if (!bridge) return
  cancelAutoClear()

  await bridge.textContainerUpgrade(new TextContainerUpgrade({
    containerID: CONTAINER_ID,
    content: pad(msg),
  }))
}

// Blank the HUD — default state
export async function hudClear() {
  if (!bridge) return
  cancelAutoClear()

  await bridge.textContainerUpgrade(new TextContainerUpgrade({
    containerID: CONTAINER_ID,
    content: ' '.repeat(LINE_WIDTH),
  }))
}

function cancelAutoClear() {
  if (clearTimer !== null) {
    clearTimeout(clearTimer)
    clearTimer = null
  }
}
