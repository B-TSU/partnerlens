# PartnerLens — Development Rules
# Even Realities G2 · AGI House Hackathon · April 26
# Tracks: 1 (Ambient Agents) + 2 (Agents with Memory)
#
# Feed this file into Cursor, Antigravity, and Claude Code as standing context.
# Every code decision in this project should be checked against these rules first.

---

## 0. JUDGING ALIGNMENT

### Track 1 — Ambient Agents
| Criterion | How PartnerLens hits it |
|---|---|
| Technical complexity | Mic → transcription → Claude inference → pattern engine → HUD, end-to-end |
| Execution quality | Seeded fallback = demo never fails; atomic HUD writes = no ghost chars |
| G2 form factor | Invisible until it matters — no screen to check, no tap required |

**When does the agent speak?** Only when `confidence >= 0.85` AND a cue pattern matches. Silent otherwise.
**Interruption is expensive.** Blank HUD is the default state. Every fire must be earned.

### Track 2 — Agents with Memory
| Criterion | How PartnerLens hits it |
|---|---|
| Technical rigor | Seeded (immutable) + learned (runtime), clear read/write/query interface |
| Long-horizon improvement | Learned patterns persist via `bridge.setLocalStorage` across sessions |
| G2 form factor | Memory surfaces as a glance — not a list to scroll |

**Baseline improvement:** Memoryless Claude ~60% on known triggers. Seeds + learned context >95%.

### Form factor test — ask before every feature:
> "Does this need to be on the face? Would a phone do this equally well?"
> If yes → cut it or redesign it.

---

## 1. TOOLCHAIN

### Three tools, three jobs — don't mix them

| Tool | Job | What to give it |
|---|---|---|
| **Claude Code** (terminal) | All Even G2 SDK work — HUD, mic, lifecycle, simulator | The Even Hub plugin handles SDK context automatically |
| **Cursor** | General JS logic — `engine.js`, `claude.js`, `patterns.js`, `actions.js` | Add RULES.md + README.md as context files |
| **Antigravity** | Rapid boilerplate / new file scaffolding | Point at README.md + RULES.md as the spec |

### Plugin install — known issue + fix
The plugin name `evenhub-skills` does NOT exist. The correct sequence:
```bash
/plugin marketplace add even-realities/everything-evenhub
# This registers it as "everything-evenhub" — then call skills as:
/everything-evenhub:quickstart partnerlens
/everything-evenhub:sdk-reference audioControl
/everything-evenhub:test-with-simulator
# etc.
```
If plugin install fails entirely — the skill markdown files are in the cloned repo at
`~/everything-evenhub/skills/` — paste the relevant skill content directly into Claude Code as context.

### Claude Code plugin install (correct commands)
```bash
# Install the Even Hub plugin for Claude Code
/plugin marketplace add even-realities/everything-evenhub
/plugin install everything-evenhub@everything-evenhub
# NOTE: "evenhub-skills" is wrong — it's "everything-evenhub"
```

### Node version requirement
```bash
node --version   # must be v20 LTS or v22+ — Node 18 is NOT supported
nvm install 20   # if needed
nvm use 20
```

### Global tools (install once)
```bash
npm install -g @evenrealities/evenhub-simulator   # v0.7.2
npm install -g @evenrealities/evenhub-cli          # v0.1.12
npm install @evenrealities/even_hub_sdk            # v0.0.10 (per-project)
```

### Claude Code skill commands (use these, don't hand-write SDK code)
```bash
/everything-evenhub:quickstart partnerlens
/everything-evenhub:template --asr partnerlens    # mic wiring included
/everything-evenhub:glasses-ui "single text container, full screen, isEventCapture"
/everything-evenhub:handle-input "foreground enter/exit lifecycle events"
/everything-evenhub:device-features "toggle microphone recording"
/everything-evenhub:background-state src/main.ts  # persist state across phone background
/everything-evenhub:test-with-simulator
/everything-evenhub:simulator-automation "screenshot and verify HUD text"
/everything-evenhub:font-measurement "single line, 22 char max, 4px padding"
/everything-evenhub:sdk-reference textContainerUpgrade
/everything-evenhub:sdk-reference audioControl
/everything-evenhub:sdk-reference createStartUpPageContainer
/everything-evenhub:build-and-deploy
```

### Cursor context setup
Add these to your Cursor project context (Settings → Rules or drag into context):
- `RULES.md` (this file)
- `README.md`
- `node_modules/@evenrealities/even_hub_sdk/dist/*.d.ts` (SDK types)

### Workflow loop
```
Cursor writes logic (engine, claude, patterns)
    ↓
Claude Code wires to SDK (hud, mic, lifecycle)
    ↓
Antigravity fills remaining boilerplate
    ↓
/test-with-simulator → verify no ghost chars
    ↓
/build-and-deploy → upload to Private channel
```

---

## 2. PLATFORM CONSTRAINTS (non-negotiable)

- NO camera — audio and text only
- NO speaker — all sound stays on phone
- NO CSS, flexbox, DOM, HTML on the glasses
- NO background or fill colors — borders and text only
- NO font control — one LVGL firmware font, fixed size
- NO direct Bluetooth — SDK bridge methods only
- NO streaming tokens to HUD — buffer Claude's full response first, write once
- NO browser localStorage/sessionStorage — use `bridge.setLocalStorage` only
- NO concurrent `updateImageRawData` calls — wait for completion before next

---

## 3. HUD DISPLAY RULES

### Silence is the default
HUD must be **blank** on startup and after auto-clear. Write only on confident match.

### Ghost character prevention (critical)
```ts
import { TextContainerUpgrade } from '@evenrealities/even_hub_sdk'

// CORRECT signature — takes a TextContainerUpgrade object, NOT separate args
async function hudWrite(text: string) {
  const padded = text.padEnd(22, ' ')   // pad to kill ghost characters
  await bridge.textContainerUpgrade(new TextContainerUpgrade({
    containerID: 1,
    content: padded,
  }))
}

async function hudClear() {
  await bridge.textContainerUpgrade(new TextContainerUpgrade({
    containerID: 1,
    content: ' '.repeat(22),
  }))
}

// WRONG — this is the old incorrect signature, do not use:
// bridge.textContainerUpgrade(CONTAINER_ID, CONTAINER_NAME, text, 0, text.length)
```

### Line budget
- **22 chars max** per line (FOV-safe)
- **3 lines max** — use 1 whenever possible
- `\n` for line breaks
- Pad every line to 22 chars

### What to show
```
Say: [suggestion]     ← line 1 only, max 22 chars
```
No transcription. No confidence numbers. No debug text. One clean suggestion or nothing.

### Auto-clear timer
Clear HUD 8 seconds after any suggestion. Suggestion was used or ignored — remove it either way.

### Page lifecycle methods
| Task | Method |
|---|---|
| Initial render | `createStartUpPageContainer` — called once at startup only |
| Live text update | `textContainerUpgrade` — use for all HUD updates |
| Layout change | `rebuildPageContainer` — only when adding/removing containers |
| Image update | `updateImageRawData` — no concurrent calls |
| Exit | `shutDownPageContainer(0)` |

### Container rules
- Max 4 image containers + 8 other containers per page
- Exactly ONE `isEventCapture: 1` per page
- `containerName` ≤ 16 chars, `containerID` unique per page
- No z-index control — later containers draw on top

---

## 4. AUDIO RULES

### app.json — required permission (without this, mic silently fails)
```json
"permissions": [{ "name": "g2-microphone", "desc": "Capture audio from glasses mic" }]
```

### Startup order — mandatory sequence
```js
// 1. Wait for bridge
const bridge = await waitForEvenAppBridge()

// 2. createStartUpPageContainer MUST return code 0 before audioControl
const result = await bridge.createStartUpPageContainer(/* ... */)
if (result !== 0) throw new Error('Page init failed — cannot start mic')

// 3. Subscribe BEFORE opening mic
const unsub = bridge.onEvenHubEvent((event) => {
  if (event.audioEvent?.audioPcm) {
    const pcm = event.audioEvent.audioPcm  // Uint8Array, 100ms of PCM
    handleAudioChunk(pcm)
  }
})

// 4. Open mic
await bridge.audioControl(true)
```

### createStartUpPageContainer — full reference
```ts
import {
  waitForEvenAppBridge,
  TextContainerProperty,
  CreateStartUpPageContainer,
  StartUpPageCreateResult,
} from '@evenrealities/even_hub_sdk'

const bridge = await waitForEvenAppBridge()

const result = await bridge.createStartUpPageContainer(new CreateStartUpPageContainer({
  containerTotalNum: 1,           // must equal total containers across all arrays
  textObject: [
    new TextContainerProperty({
      containerID: 1,
      containerName: 'main',      // max 16 chars
      xPosition: 0, yPosition: 0,
      width: 576, height: 288,
      isEventCapture: 1,          // exactly ONE container must have this
      content: ' '.repeat(22),    // start blank, padded
      borderWidth: 0,
      paddingLength: 4,
    }),
  ],
}))

if (result !== StartUpPageCreateResult.success) {
  // result codes: 0=success, 1=invalid, 2=oversize, 3=outOfMemory
  console.error('Startup failed:', result)
  return
}
// Only now can you call audioControl or imuControl
```

- `widgetId` — omit, SDK assigns automatically
- `containerTotalNum` — must exactly match the total number of container objects passed
- Called **exactly once** — use `rebuildPageContainer` for subsequent full redraws

### Audio format
| Property | Value |
|---|---|
| Sample rate | 16,000 Hz |
| Format | Signed 16-bit little-endian PCM |
| Chunk size | 100ms per event (1,600 samples / 3,200 bytes) |
| Delivery | `event.audioEvent.audioPcm` (Uint8Array) |

### Teardown — always both
```js
await bridge.audioControl(false)
unsub()  // always unsubscribe the event listener too
```

### Critical limitations
- **Mic CANNOT be tested in the simulator** — `audioEvent` never fires there
- Test mic + transcription on real glasses only
- Stop mic on `FOREGROUND_EXIT_EVENT` — always
- Restart mic on `FOREGROUND_ENTER_EVENT` — always
- Accumulate 100ms chunks into a 3s buffer before sending to transcription
- All transcription on the phone — never forward raw PCM elsewhere

---

## 5. CLAUDE API RULES

```js
// Always use this model
model: 'claude-sonnet-4-20250514'
max_tokens: 1000
```

**System prompt must include:**
1. All seeded patterns (JSON)
2. All learned patterns from localStorage (JSON)
3. Last 5 conversation turns (rolling window)
4. "Respond only in JSON. No markdown. No preamble."

**Required response shape:**
```js
{
  "suggestion": string,      // max 16 chars — fits "Say: " + suggestion in 22
  "intent": string,          // e.g. "hungry", "bored", "tired"
  "confidence": number,      // 0.0–1.0
  "shouldDisplay": boolean,  // agent decides whether to speak
  "newPattern": object|null  // if new pattern detected this turn
}
```

**Rules:**
- Display HUD only when `shouldDisplay === true` AND `confidence >= 0.85`
- Parse: `.replace(/```json|```/g, '').trim()` before `JSON.parse`
- Wrap every call in try/catch — on failure: `hudClear()`, never show error on HUD
- Never block the HUD write on a phone action

---

## 6. PATTERN ENGINE

### Decision priority (strict order)
```
1. Exact seeded match      → instant HUD write, NO Claude call  (<100ms)
2. Fuzzy seeded match      → Claude confirms + picks seed        (<3s)
3. Learned pattern match   → Claude confirms + uses learned      (<3s)
4. No match                → Claude infers from history          (<3s)
5. New pattern detected    → Claude infers + saves to storage    (<3s)
```

### Seeded pattern schema
```js
{
  id: string,                // "hungry-pho"
  trigger: string,           // "are you hungry"
  realMeaning: string,       // "wants company + already knows what she wants"
  rejections: string[],      // ["pizza", "chinese", "burrito"]
  suggestion: string,        // "Pho" — max 16 chars
  place: string|null,        // "PPQ Duc Huong"
  mapsDeeplink: string|null, // "https://maps.google.com/?q=PPQ+Duc+Huong"
  confidence: number         // base seed confidence, e.g. 0.95
}
```

### Memory interface
```js
// Write learned pattern
const learned = await bridge.getLocalStorage('patterns:learned')
const arr = learned ? JSON.parse(learned) : []
arr.push(newPattern)
await bridge.setLocalStorage('patterns:learned', JSON.stringify(arr))

// Read on startup
const raw = await bridge.getLocalStorage('patterns:learned')
const learnedPatterns = raw ? JSON.parse(raw) : []
```

**Seeded patterns are immutable.** Never modify them at runtime. Learned = append-only.

---

## 7. BACKGROUND STATE

Use `/background-state` Claude Code skill on `src/main.ts` to wire `setBackgroundState` + `onBackgroundRestore`. This preserves mic state and learned patterns when phone goes to background.

```js
// Required lifecycle handlers
FOREGROUND_ENTER_EVENT  → start mic, load learned patterns, hudClear()
FOREGROUND_EXIT_EVENT   → stop mic, save learned patterns, hudClear()
ABNORMAL_EXIT_EVENT     → stop mic, flush storage
SYSTEM_EXIT_EVENT       → stop mic, flush storage
```

Unsubscribe all listeners on every exit event.

---

## 8. PHONE ACTIONS

```js
// Maps deeplink — fire and forget
const openMaps = (url) => window.open(url, '_blank')

// Only trigger when:
// 1. confidence >= 0.85
// 2. pattern has a mapsDeeplink
// 3. HUD suggestion already written (phone action is secondary)
```

---

## 9. SIMULATOR REFERENCE

### Launch
```bash
npm run dev
# In a second terminal:
npx evenhub-simulator -g http://localhost:5173
```

### Key inputs
| Key | Glasses action |
|---|---|
| Up/Down arrows | Scroll up/down |
| Click | Single tap |
| Double-click | Double tap |

- **Screenshot:** Click the simulator display → saves timestamped PNG to working directory
- **Debug payloads:** `RUST_LOG=debug npx evenhub-simulator http://localhost:5173`

### Simulator limitations (must test on real hardware)
| Feature | Simulator | Real glasses |
|---|---|---|
| HUD display | ✅ approximate | ✅ exact |
| Mic / audioEvent | ❌ never fires | ✅ |
| IMU data | ❌ always null | ✅ |
| onDeviceStatusChanged | ❌ never fires | ✅ |
| eventSource | ❌ hardcoded as 1 | ✅ |
| Font rendering | ⚠️ approximate | ✅ exact |

**For PartnerLens:** Build and verify HUD layout in simulator. Test mic, transcription, and full audio pipeline on real G2 only.

---

## 10. BUILD & DEPLOY

```bash
npm run build
npx evenhub pack app.json dist -o partnerlens.ehpk
# Upload to hub.evenrealities.com → Dev Portal → Private channel
```

- Stay **Private** all day — don't ship to Public during hackathon
- Fix-forward only — no rollbacks, increment version and ship
- Demo via simulator (`npx evenhub-simulator`) — primary demo path for judges

### Pre-upload checklist
- [ ] Build passes clean
- [ ] Simulator: no ghost chars on HUD
- [ ] Mic starts/stops on foreground events
- [ ] API key in `.env`, not in code
- [ ] All HUD strings padded to 22 chars
- [ ] "hungry → Pho → PPQ" fires from seed (no internet required)
- [ ] HUD auto-clears after 8s

---

## 11. CODE STRUCTURE

```
src/
├── main.js       # bridge init, lifecycle, event routing
├── hud.js        # ALL display writes — hudWrite(), hudClear() only
├── mic.js        # audioControl, rolling transcription chunks
├── patterns.js   # seeded patterns array (immutable, hardcoded)
├── claude.js     # Claude API call, response parsing, fallback
├── engine.js     # decision tree: seed → fuzzy → learned → Claude
└── actions.js    # Maps deeplink, phone notifications
```

- Vanilla JS, ES modules — no framework
- Async/await only — no raw `.then()` chains
- `debug(msg)` wrapper — single `DEBUG = false` toggle silences all logs for demo
- `.env` for all secrets — `VITE_CLAUDE_API_KEY`

---

## 12. DEMO SAFETY

- "Are you hungry?" → `Say: Pho` → Maps PPQ — **seeded path only, never Claude**
- Claude API down → seeds still fire, HUD still works
- Mic failure → show `Listening...`, do not crash
- End-to-end target: **< 3 seconds** from speech to HUD
- Run full simulator flow before every demo

---

## 13. SDK DOES NOT SUPPORT (never attempt)

Arbitrary pixel drawing · audio output · text alignment · per-item list styling ·
programmatic scroll · animations · camera · background colors · multiple font sizes
