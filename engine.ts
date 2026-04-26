// engine.ts
// Decision tree: seed → fuzzy → learned → Claude
// Exact seed match fires instantly with no API call

import { findExactSeed, findFuzzySeed, normalize, type Pattern, ALL_PATTERNS } from './patterns'
import { inferFromClaude, type ConversationTurn, type ClaudeResult } from './claude'
import { hudWrite, hudClear } from './hud'
import { triggerPhoneAction } from './actions'

const DEBUG = false
const log = (...args: any[]) => DEBUG && console.log('[engine]', ...args)

const CONFIDENCE_THRESHOLD = 0.85
let learnedPatterns: Pattern[] = []
let conversationHistory: ConversationTurn[] = []

export function loadLearnedPatterns(patterns: Pattern[]) {
  learnedPatterns = patterns
}

export function getLearnedPatterns(): Pattern[] {
  return learnedPatterns
}

export function addToHistory(speaker: 'partner' | 'you', text: string) {
  conversationHistory.push({ speaker, text })
  // Keep rolling window of last 10 turns
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(-10)
  }
}

export function getHistory(): ConversationTurn[] {
  return conversationHistory
}

// Main entry point — called with every new transcript chunk
export async function processTranscript(transcript: string): Promise<void> {
  if (!transcript || transcript.trim().length < 3) return

  addToHistory('partner', transcript)
  log('processing:', transcript)

  // ── Step 1: Exact seeded match → instant, no API call ──────────────────
  const exact = findExactSeed(transcript)
  if (exact) {
    log('exact seed match:', exact.id)
    await firePattern(exact)
    return
  }

  // ── Step 2: Fuzzy seeded match → Claude confirms ────────────────────────
  const fuzzy = findFuzzySeed(transcript, 0.5)
  if (fuzzy) {
    log('fuzzy seed match:', fuzzy.pattern.id, 'score:', fuzzy.score)
    // Use the seed directly if score is high enough
    if (fuzzy.score >= 0.75) {
      await firePattern(fuzzy.pattern)
      return
    }
    // Otherwise let Claude confirm with the fuzzy match as context hint
  }

  // ── Step 3: Check learned patterns ─────────────────────────────────────
  const learned = findInLearned(transcript)
  if (learned) {
    log('learned pattern match:', learned.id)
    await firePattern(learned)
    return
  }

  // ── Step 4: Claude inference ────────────────────────────────────────────
  log('no seed match — calling Claude')
  const result = await inferFromClaude(transcript, conversationHistory, learnedPatterns)

  if (result.shouldDisplay && result.confidence >= CONFIDENCE_THRESHOLD) {
    log('Claude suggests:', result.suggestion)
    await hudWrite(result.suggestion)

    // Save new pattern if Claude detected one
    if (result.newPattern) {
      log('saving new pattern:', result.newPattern.id)
      await saveLearnedPattern(result.newPattern as Pattern)
    }
  } else {
    log('Claude: not confident enough, staying silent')
  }
}

async function firePattern(pattern: Pattern): Promise<void> {
  await hudWrite(pattern.suggestion)

  // Trigger Maps if pattern has a location
  if (pattern.mapsDeeplink && pattern.confidence >= CONFIDENCE_THRESHOLD) {
    triggerPhoneAction(pattern.mapsDeeplink, pattern.place ?? '')
  }
}

function findInLearned(transcript: string): Pattern | null {
  const t = normalize(transcript)
  for (const pattern of learnedPatterns) {
    for (const trigger of (pattern.triggers ?? [])) {
      if (t.includes(normalize(trigger))) {
        return pattern
      }
    }
  }
  return null
}

async function saveLearnedPattern(pattern: Pattern): Promise<void> {
  // Avoid duplicates
  if (learnedPatterns.find(p => p.id === pattern.id)) return
  learnedPatterns = [...learnedPatterns, pattern]
  // Caller (main.ts) handles persisting to bridge.setLocalStorage
}
