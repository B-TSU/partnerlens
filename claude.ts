// claude.ts
// Claude API inference — buffers full response before touching HUD
// Never stream tokens to HUD

import { SEEDED_PATTERNS, CLIENT_PATTERNS, type Pattern } from './patterns'

const DEBUG = false
const log = (...args: any[]) => DEBUG && console.log('[claude]', ...args)

export interface ClaudeResult {
  suggestion: string       // max 16 chars
  intent: string           // e.g. "hungry", "tired", "deflecting"
  confidence: number       // 0.0–1.0
  shouldDisplay: boolean   // agent decides whether to speak
  newPattern: Partial<Pattern> | null
}

export interface ConversationTurn {
  speaker: 'partner' | 'you'
  text: string
}

const FALLBACK: ClaudeResult = {
  suggestion: '',
  intent: 'unknown',
  confidence: 0,
  shouldDisplay: false,
  newPattern: null,
}

export async function inferFromClaude(
  transcript: string,
  history: ConversationTurn[],
  learnedPatterns: Pattern[]
): Promise<ClaudeResult> {
  const apiKey = (import.meta as any).env?.VITE_CLAUDE_API_KEY
  if (!apiKey) {
    console.error('[claude] No API key — set VITE_CLAUDE_API_KEY in .env')
    return FALLBACK
  }

  const systemPrompt = buildSystemPrompt(learnedPatterns)
  const userMessage = buildUserMessage(transcript, history)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      console.error('[claude] API error:', response.status)
      return FALLBACK
    }

    const data = await response.json()
    const raw = data.content?.[0]?.text ?? ''
    log('raw response:', raw)

    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed: ClaudeResult = JSON.parse(clean)

    // Validate suggestion length for HUD
    if (parsed.suggestion && parsed.suggestion.length > 16) {
      parsed.suggestion = parsed.suggestion.substring(0, 16)
    }

    return parsed
  } catch (err) {
    console.error('[claude] Failed:', err)
    return FALLBACK
  }
}

function buildSystemPrompt(learnedPatterns: Pattern[]): string {
  return `You are a silent co-pilot running on smart glasses. You listen to conversations and detect when someone's words don't match their actual intent — then suggest the ideal calm, professional, or strategic reply.

You operate in two contexts:

CONTEXT 1 — RELATIONSHIP (personal, casual)
Known patterns about this person's partner:
${JSON.stringify(SEEDED_PATTERNS, null, 2)}

CONTEXT 2 — CLIENT / BUSINESS (professional, design work)
Known patterns for difficult client interactions:
${JSON.stringify(CLIENT_PATTERNS, null, 2)}

LEARNED PATTERNS (discovered at runtime):
${learnedPatterns.length > 0 ? JSON.stringify(learnedPatterns, null, 2) : 'None yet.'}

RESPONSE RULES:
- Respond ONLY with valid JSON. No markdown. No preamble. No explanation.
- suggestion: max 16 characters — this appears on a tiny glasses HUD
- For client context: suggest professional de-escalation or clarifying questions, never aggression
- For relationship context: suggest the real answer she wants, not the literal one
- shouldDisplay: false if conversation is neutral or not enough context
- Only fire when confident — silence is better than a wrong suggestion
- newPattern: populate ONLY if you detect a brand new recurring pattern

Required JSON shape:
{
  "suggestion": string,
  "intent": string,
  "confidence": number,
  "shouldDisplay": boolean,
  "newPattern": null | { "id": string, "triggers": string[], "realMeaning": string, "suggestion": string, "confidence": number }
}\`
}`
}

function buildUserMessage(transcript: string, history: ConversationTurn[]): string {
  const historyText = history
    .slice(-5)
    .map(t => `${t.speaker === 'partner' ? 'Partner' : 'You'}: "${t.text}"`)
    .join('\n')

  return `Conversation history (last 5 turns):
${historyText || '(none yet)'}

Latest thing partner just said:
"${transcript}"

What should I say? Respond with JSON only.`
}
