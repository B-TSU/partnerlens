// patterns.ts
// Seeded partner patterns — IMMUTABLE, never modify at runtime
// These fire instantly without a Claude API call

export interface Pattern {
  id: string
  triggers: string[]        // phrases that activate this pattern
  realMeaning: string       // what she actually means (fed to Claude as context)
  rejections: string[]      // things she says no to in this scenario
  suggestion: string        // what YOU say — max 16 chars for HUD
  followUp?: string         // second suggestion if first is rejected
  place?: string
  mapsDeeplink?: string
  confidence: number        // base confidence 0–1
}

export const SEEDED_PATTERNS: Pattern[] = [
  {
    id: 'hungry-pho',
    triggers: [
      'are you hungry',
      'im hungry',
      "i'm hungry",
      'you hungry',
      'should we eat',
      'wanna eat',
    ],
    realMeaning: "Wants to eat together. Already knows what she wants. Will reject suggestions until you land on the usual.",
    rejections: ['pizza', 'chinese', 'burrito', 'tacos', 'sushi', 'thai', 'indian'],
    suggestion: 'Say: Pho?',
    followUp: 'PPQ Duc Huong',
    place: 'PPQ Duc Huong',
    mapsDeeplink: 'https://maps.google.com/?q=PPQ+Duc+Huong+San+Francisco',
    confidence: 0.97,
  },
  {
    id: 'tired-home',
    triggers: [
      "i'm tired",
      'im tired',
      'i am tired',
      'so tired',
      'feeling tired',
      'exhausted',
    ],
    realMeaning: "Doesn't want to think or decide. Wants to be taken care of — go home, decompress. NOT actually about sleep.",
    rejections: ['just sit here', 'stay longer', 'one more thing', 'after this'],
    suggestion: "Let's head out",
    followUp: 'Want to go home?',
    place: null,
    mapsDeeplink: null,
    confidence: 0.93,
  },
  {
    id: 'what-do-you-want',
    triggers: [
      'what do you want to do',
      'what do you wanna do',
      'what should we do',
      'what are we doing',
      'what do you feel like',
      'what do you want',
    ],
    realMeaning: "She already has something in mind. This is a test — she wants you to guess her top choice, not actually decide.",
    rejections: ['i dont know', "i don't know", 'whatever', 'up to you', 'you decide'],
    suggestion: 'Boba run?',
    followUp: 'Walk + dessert?',
    place: null,
    mapsDeeplink: null,
    confidence: 0.88,
  },
  {
    id: 'whatever-you-want',
    triggers: [
      'whatever you want',
      'up to you',
      'you decide',
      "i don't mind",
      'i dont mind',
      'anything is fine',
      'either is fine',
      'you pick',
    ],
    realMeaning: "Does NOT mean whatever you want. She has top choices in her head. Wrong answer = disappointment. This is a guessing game — narrow to her most likely preferences.",
    rejections: ['ok', 'sounds good', 'sure', 'alright'],
    suggestion: 'Pho or boba?',
    followUp: 'Coffee walk?',
    place: null,
    mapsDeeplink: null,
    confidence: 0.85,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS / CLIENT PATTERNS
// Context: design work, client feedback, scope management
// HUD role: stay calm, set a boundary, redirect professionally
// ─────────────────────────────────────────────────────────────────────────────

export const CLIENT_PATTERNS: Pattern[] = [
  {
    id: 'client-just-do-this',
    triggers: [
      'just do this',
      'just change this',
      'just make it',
      'just fix it',
      'just add',
      'its easy',
      "it's easy",
      'should be simple',
      'shouldnt take long',
      "shouldn't take long",
      'cant be that hard',
      "can't be that hard",
      'just a small thing',
      'quick thing',
      'only takes a minute',
    ],
    realMeaning: "Client is minimizing scope. They don't understand the work involved and are asserting control through false simplicity. Not malicious — just ignorant of the process.",
    rejections: ['ok', 'sure', 'no problem', 'yeah'],  // don't just agree
    suggestion: 'Scope it first',
    followUp: 'Happy to — timeline?',
    place: null,
    mapsDeeplink: null,
    confidence: 0.92,
  },
  {
    id: 'client-i-know-what-i-want',
    triggers: [
      'i know what i want',
      'i know exactly',
      'its clear',
      "it's clear",
      'this is obvious',
      'anyone can see',
      'make it pop',
      'make it modern',
      'make it clean',
      'make it professional',
      'make it better',
      'you know what i mean',
    ],
    realMeaning: "Client thinks they're being specific but they're not. Vague direction disguised as certainty. Proceeding without clarification = guaranteed revision loop.",
    rejections: ['ok got it', 'sure', 'understood'],
    suggestion: 'Can you show me?',
    followUp: 'Reference example?',
    place: null,
    mapsDeeplink: null,
    confidence: 0.89,
  },
  {
    id: 'client-we-talked-about-this',
    triggers: [
      'we talked about this',
      'i already said',
      'i told you',
      'like i said',
      'as i mentioned',
      'we agreed',
      'i thought we agreed',
      'didnt we discuss',
      "didn't we discuss",
    ],
    realMeaning: "Client is asserting dominance and rewriting history. Either genuinely misremembering or trying to avoid a paper trail. Don't argue — redirect to documentation.",
    rejections: ['no we didnt', 'actually', 'thats not what happened'],
    suggestion: "Let's check notes",
    followUp: 'Send recap email',
    place: null,
    mapsDeeplink: null,
    confidence: 0.91,
  },
  {
    id: 'client-why-is-this-taking-so-long',
    triggers: [
      'why is this taking so long',
      'how long does this take',
      'when will it be done',
      'its been a while',
      "it's been a while",
      'whats taking so long',
      "what's taking so long",
      'this should be done by now',
      'other designers do this faster',
      'my last designer',
      'my previous designer',
    ],
    realMeaning: "Client is anxious about timeline and projecting it as criticism. Often means they're feeling out of control. Needs transparency and a concrete date — not an apology.",
    rejections: ['sorry', 'my bad', 'ill try harder'],
    suggestion: 'Timeline update?',
    followUp: 'Current: [X]. ETA: [Y]',
    place: null,
    mapsDeeplink: null,
    confidence: 0.90,
  },
  {
    id: 'client-not-what-i-wanted',
    triggers: [
      'not what i wanted',
      'this isnt right',
      "this isn't right",
      'this is wrong',
      'start over',
      'completely different',
      'totally off',
      'not the direction',
      'missed the brief',
      'not what we discussed',
      'thats not it',
    ],
    realMeaning: "Vague rejection. Before doing anything, need to know WHAT specifically is wrong. 'Start over' without direction = same result. Ask one clarifying question before touching a single pixel.",
    rejections: ['ok ill redo it', 'sorry', 'starting over'],
    suggestion: 'What specifically?',
    followUp: 'Color, layout, style?',
    place: null,
    mapsDeeplink: null,
    confidence: 0.93,
  },
  {
    id: 'client-scope-creep',
    triggers: [
      'while youre at it',
      'one more thing',
      'also can you',
      'and another thing',
      'small addition',
      'tiny change',
      'while we have you',
      'one last thing',
      'oh and',
      'by the way',
      'actually could you also',
    ],
    realMeaning: "Scope creep. Each 'small thing' adds up. Client is testing boundaries — if unchallenged, this becomes the norm. This is a billing and expectation moment.",
    rejections: ['sure', 'no problem', 'yeah of course'],
    suggestion: "That's a new item",
    followUp: "Add to scope doc?",
    place: null,
    mapsDeeplink: null,
    confidence: 0.90,
  },
]

// Combined — all patterns for engine to search
export const ALL_PATTERNS: Pattern[] = [...SEEDED_PATTERNS, ...CLIENT_PATTERNS]

// Normalize text for matching
export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

// Check if transcript matches any pattern trigger exactly
export function findExactSeed(transcript: string): Pattern | null {
  const t = normalize(transcript)
  for (const pattern of ALL_PATTERNS) {
    for (const trigger of pattern.triggers) {
      if (t.includes(normalize(trigger))) {
        return pattern
      }
    }
  }
  return null
}

// Fuzzy match — returns pattern + score if above threshold
export function findFuzzySeed(transcript: string, threshold = 0.6): { pattern: Pattern; score: number } | null {
  const t = normalize(transcript)
  let best: { pattern: Pattern; score: number } | null = null

  for (const pattern of ALL_PATTERNS) {
    for (const trigger of pattern.triggers) {
      const score = jaccardSimilarity(t, normalize(trigger))
      if (score >= threshold && (!best || score > best.score)) {
        best = { pattern, score }
      }
    }
  }
  return best
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(' '))
  const setB = new Set(b.split(' '))
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return intersection.size / union.size
}
