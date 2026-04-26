// mic.ts
// Transcription via Web Speech API (browser-native, no API key)
// PCM from G2 mic is captured but Web Speech uses the phone/laptop mic directly
//
// IMPORTANT SIMULATOR NOTE:
// - G2 audioEvent never fires in simulator
// - Web Speech API WILL work in simulator using your laptop mic
// - Full end-to-end (G2 mic → Web Speech) only on real glasses

import { OsEventTypeList } from '@evenrealities/even_hub_sdk'

const DEBUG = false
const log = (...args: any[]) => DEBUG && console.log('[mic]', ...args)

let bridge: any = null
let recognition: any = null
let onTranscriptCallback: ((text: string) => void) | null = null
let isRunning = false
let bridgeUnsub: (() => void) | null = null

export function initMic(appBridge: any, onTranscript: (text: string) => void) {
  bridge = appBridge
  onTranscriptCallback = onTranscript
}

export async function startMic(): Promise<boolean> {
  if (isRunning) return true

  // Start G2 hardware mic (for real glasses — audioEvent won't fire in simulator)
  if (bridge) {
    bridgeUnsub = bridge.onEvenHubEvent((event: any) => {
      // G2 PCM arrives here on real hardware — Web Speech handles transcription separately
      if (event.audioEvent?.audioPcm) {
        log('G2 audio chunk received, length:', event.audioEvent.audioPcm.length)
      }
    })
    await bridge.audioControl(true).catch((e: any) => log('audioControl error:', e))
  }

  // Start Web Speech API — works in simulator + real glasses
  startWebSpeech()
  isRunning = true
  return true
}

export async function stopMic(): Promise<void> {
  if (!isRunning) return

  // Stop G2 hardware mic
  if (bridge) {
    await bridge.audioControl(false).catch((e: any) => log('audioControl stop error:', e))
    bridgeUnsub?.()
    bridgeUnsub = null
  }

  // Stop Web Speech
  stopWebSpeech()
  isRunning = false
  log('mic stopped')
}

// ── Web Speech API ──────────────────────────────────────────────────────────

function startWebSpeech() {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!SpeechRecognition) {
    console.error('[mic] Web Speech API not supported in this browser — use Chrome')
    return
  }

  recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.continuous = true       // keep listening, don't stop after one phrase
  recognition.interimResults = false  // only fire on final results
  recognition.maxAlternatives = 1

  recognition.onresult = (event: any) => {
    const result = event.results[event.results.length - 1]
    if (result.isFinal) {
      const text = result[0].transcript.trim()
      if (text && text.length > 2) {
        log('transcript:', text)
        onTranscriptCallback?.(text)
      }
    }
  }

  recognition.onerror = (event: any) => {
    log('speech error:', event.error)
    // Auto-restart on recoverable errors
    if (event.error === 'no-speech' || event.error === 'audio-capture') {
      setTimeout(() => {
        if (isRunning) startWebSpeech()
      }, 1000)
    }
  }

  recognition.onend = () => {
    // Auto-restart — continuous mode can stop unexpectedly
    if (isRunning) {
      log('recognition ended unexpectedly, restarting...')
      setTimeout(() => {
        if (isRunning) recognition?.start()
      }, 300)
    }
  }

  recognition.start()
  log('Web Speech API started')
}

function stopWebSpeech() {
  if (recognition) {
    recognition.onend = null  // prevent auto-restart
    recognition.stop()
    recognition = null
  }
}
