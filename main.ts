// main.ts
// App entry point — bridge init, lifecycle, storage, event routing
// Phone does the work. Glasses show the answer.

import {
  waitForEvenAppBridge,
  TextContainerProperty,
  CreateStartUpPageContainer,
  StartUpPageCreateResult,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'

import { initHud, hudClear, hudStatus } from './hud'
import { initMic, startMic, stopMic } from './mic'
import { processTranscript, loadLearnedPatterns, getLearnedPatterns } from './engine'

const STORAGE_KEY = 'patterns:learned'

async function main() {
  // ── 1. Get bridge ───────────────────────────────────────────────────────
  const bridge = await waitForEvenAppBridge()

  // ── 2. Init HUD module ──────────────────────────────────────────────────
  initHud(bridge)

  // ── 3. Create startup page — MUST succeed before mic or anything else ───
  const result = await bridge.createStartUpPageContainer(
    new CreateStartUpPageContainer({
      containerTotalNum: 1,
      textObject: [
        new TextContainerProperty({
          containerID: 1,
          containerName: 'main',
          xPosition: 0,
          yPosition: 0,
          width: 576,
          height: 288,
          isEventCapture: 1,
          content: ' '.repeat(22),   // blank — HUD is silent by default
          borderWidth: 0,
          paddingLength: 4,
        }),
      ],
    })
  )

  if (result !== StartUpPageCreateResult.success) {
    console.error('[main] createStartUpPageContainer failed:', result)
    return
  }

  // ── 4. Load learned patterns from storage ───────────────────────────────
  try {
    const stored = await bridge.getLocalStorage(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      loadLearnedPatterns(parsed)
      console.log('[main] loaded learned patterns:', parsed.length)
    }
  } catch {
    console.log('[main] no stored patterns yet')
  }

  // ── 5. Init mic ─────────────────────────────────────────────────────────
  initMic(bridge, async (transcript: string) => {
    await processTranscript(transcript)

    // Persist any new learned patterns after each transcript
    const learned = getLearnedPatterns()
    if (learned.length > 0) {
      await bridge.setLocalStorage(STORAGE_KEY, JSON.stringify(learned)).catch(() => {})
    }
  })

  // ── 6. Lifecycle events ─────────────────────────────────────────────────
  bridge.onEvenHubEvent(async (event: any) => {
    const type = event.sysEvent?.eventType

    if (type === OsEventTypeList.FOREGROUND_ENTER_EVENT) {
      console.log('[main] foreground — starting mic')
      await hudStatus('Listening...')
      await startMic()
      // Clear status after 2s, go back to silent
      setTimeout(() => hudClear(), 2000)
    }

    if (
      type === OsEventTypeList.FOREGROUND_EXIT_EVENT ||
      type === OsEventTypeList.ABNORMAL_EXIT_EVENT ||
      type === OsEventTypeList.SYSTEM_EXIT_EVENT
    ) {
      console.log('[main] background/exit — stopping mic')
      await stopMic()
      await hudClear()

      // Flush learned patterns to storage
      const learned = getLearnedPatterns()
      if (learned.length > 0) {
        await bridge.setLocalStorage(STORAGE_KEY, JSON.stringify(learned)).catch(() => {})
      }
    }
  })

  // ── 7. Start listening ──────────────────────────────────────────────────
  await hudStatus('Listening...')
  await startMic()
  setTimeout(() => hudClear(), 2000)

  console.log('[main] PartnerLens ready')
}

main().catch(console.error)
