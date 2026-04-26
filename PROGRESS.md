# PartnerLens — Build Progress & Context
# AGI House Hackathon · April 26 · Even Realities G2
# Feed this file into any AI to get full context on where we are

---

## What We're Building

**PartnerLens** — an ambient agent for Even Realities G2 smart glasses that listens to conversations, detects subtext and contextual cues, and surfaces a suggested reply on the HUD before you have to think.

No camera. No tap. Invisible until it matters.

**Tracks:** Ambient Agents (Track 1) + Agents with Memory (Track 2)

---

## Current Status: READY TO BUILD

All source files written. Simulator confirmed working. API key needs to be added.

---

## What's Done

### ✅ Environment
- Cloned `even-realities/everything-evenhub`
- Scaffolded `partnerlens` project at `~/my-weather-app/partnerlens/`
- Even Hub SDK installed (`@evenrealities/even_hub_sdk` v0.0.10)
- Simulator confirmed working — "Hello from G2!" displayed on Glasses Display window
- Dev server running at `http://localhost:5173`
- Claude Code plugin installed via `/plugin marketplace add even-realities/everything-evenhub`

### ✅ All Source Files Written
| File | Purpose |
|---|---|
| `src/main.ts` | Bridge init, lifecycle, startup sequence |
| `src/hud.ts` | All HUD display writes — ghost-char safe, auto-clear |
| `src/mic.ts` | Web Speech API (primary) + G2 hardware mic |
| `src/patterns.ts` | All seeded patterns — personal + client contexts |
| `src/engine.ts` | Decision tree: seed → fuzzy → learned → Claude |
| `src/claude.ts` | Claude API call, JSON parsing, fallback |
| `src/actions.ts` | Maps deeplink trigger |
| `app.json` | Even Hub manifest with g2-microphone permission |
| `.env.example` | API key template |
| `README.md` | Project overview and setup |
| `RULES.md` | Full dev ruleset for Claude Code / Cursor / Antigravity |

### ✅ Seeded Patterns (hardcoded, no API needed)

**Personal / Relationship:**
- "Are you hungry?" → `Say: Pho?` → Opens Maps to PPQ Duc Huong
- "I'm tired" → `Say: Let's head out` (means: don't make me think, go home)
- "What do you want to do?" → `Say: Boba run?` (she already has something in mind)
- "Whatever you want" / "Up to you" → `Say: Pho or boba?` (definitely NOT whatever you want)

**Business / Client (design context):**
- "Just do this" / "It's easy" / "Shouldn't take long" → `Scope it first`
- "Make it pop" / "Make it clean" / vague direction → `Can you show me?`
- "We talked about this" / "I already said" → `Let's check notes`
- "Why is this taking so long?" → `Timeline update?`
- "This isn't what I wanted" / "Start over" → `What specifically?`
- "One more thing" / "While you're at it" → `That's a new item` (scope creep)

---

## Architecture

```
G2 Mic (4-mic array · PCM 16kHz)
    ↓
Web Speech API (browser-native, no API key, Chrome only)
    ↓
Pattern Engine (engine.ts)
  ├─ Exact seed match?  → instant HUD write  (<100ms, no API)
  ├─ Fuzzy seed match?  → HUD write
  └─ No match?          → Claude API         (<3s)
    ↓
HUD: "Say: Pho?"        ← atomic write, 22-char padded
Phone: Maps deeplink    ← fire and forget
```

**Phone does the work. Glasses show the answer.**

---

## Key Technical Decisions Made

### Transcription: Web Speech API (not Whisper)
- Free, browser-native, no extra API key
- Works in Chrome on simulator AND real glasses
- `continuous: true` — keeps listening all day
- Auto-restarts on `onend` and `no-speech` errors
- Only requires `VITE_CLAUDE_API_KEY` in `.env`

### HUD: Ghost-char prevention
Every string padded to 22 chars with spaces before writing:
```ts
await bridge.textContainerUpgrade(new TextContainerUpgrade({
  containerID: 1,
  content: text.padEnd(22, ' '),  // kills ghost characters
}))
```
Note: `textContainerUpgrade` takes an **object**, not separate args.

### Pattern Memory: Hybrid approach
- Seeded patterns = immutable, fire instantly without Claude
- Learned patterns = saved to `bridge.setLocalStorage` across sessions
- Claude only called when no seed matches

### Startup sequence (mandatory order)
1. `waitForEvenAppBridge()`
2. `createStartUpPageContainer()` → must return `0`
3. Subscribe to events
4. `audioControl(true)`

### Confidence threshold
HUD only fires when `confidence >= 0.85`. Silent otherwise.
Auto-clears after 8 seconds.

---

## Known Issues / Things to Watch

- **Web Speech API = Chrome only** — test on your specific phone before demo
- **Mic cannot be tested in simulator** — `audioEvent` never fires there; test on real G2
- **`--legacy-peer-deps`** needed on every `npm install` (TS6 vs CLI peer dep conflict)
- **Node v20 or v22 required** — v18 is NOT supported by the SDK
- **Plugin skill prefix** is `/everything-evenhub:skillname` not `/skillname`
- **`app.json` must have** `"permissions": [{ "name": "g2-microphone" }]` or mic silently fails

---

## What Still Needs To Be Done

### Before Hackathon (tonight)
- [ ] Add real Claude API key: `echo "VITE_CLAUDE_API_KEY=sk-ant-..." > ~/my-weather-app/partnerlens/.env`
- [ ] Copy all source files into `~/my-weather-app/partnerlens/src/`
- [ ] Replace `app.json` with new one (has mic permission)
- [ ] Run `npm run dev` + simulator → verify HUD renders
- [ ] Test pattern matching: say "are you hungry" → confirm `Say: Pho?` appears

### At Hackathon
- [ ] 9am — Verify G2 pairs to phone
- [ ] 10am — Test mic on real G2 (Web Speech + hardware mic)
- [ ] 11am — Full demo run: "are you hungry" → HUD fires → Maps opens
- [ ] 12pm — Polish + test client patterns
- [ ] 2pm — Simulator screenshots for demo deck
- [ ] 4pm — Package `.ehpk` and upload to Private channel

### Demo Plan
1. **Simulator on laptop** — mirrors HUD for judges (primary)
2. **Wear G2** — bonus for judges who want to try
3. **Two demo scenarios:**
   - Personal: "Are you hungry?" → `Say: Pho?` → Maps to PPQ
   - Client: "Just make it pop, shouldn't take long" → `What specifically?`

---

## File Locations

```
~/my-weather-app/partnerlens/     ← project root
├── src/
│   ├── main.ts
│   ├── hud.ts
│   ├── mic.ts
│   ├── patterns.ts
│   ├── engine.ts
│   ├── claude.ts
│   └── actions.ts
├── app.json                      ← has g2-microphone permission
├── .env                          ← add VITE_CLAUDE_API_KEY here
├── README.md
└── RULES.md
```

---

## Quick Commands

```bash
# Dev server
cd ~/my-weather-app/partnerlens && npm run dev

# Simulator (second terminal)
npx evenhub-simulator -g http://localhost:5173

# Real glasses (same Wi-Fi)
npx evenhub qr --url http://<your-ip>:5173

# Package for upload
npx evenhub pack app.json dist -o partnerlens.ehpk

# If npm install fails
npm install --legacy-peer-deps

# Claude Code skills
/everything-evenhub:sdk-reference textContainerUpgrade
/everything-evenhub:test-with-simulator
/everything-evenhub:build-and-deploy
```

---

## Resources
- [Even Hub Docs](https://hub.evenrealities.com/docs/getting-started/overview)
- [Skill Catalog](https://hub.evenrealities.com/docs/AI-tooling/claude%20code/skill-catalog)
- [Display & UI System](https://hub.evenrealities.com/docs/guides/display)
- [Device APIs](https://hub.evenrealities.com/docs/guides/device-apis)
- [SDK npm](https://www.npmjs.com/package/@evenrealities/even_hub_sdk)
- [Community Discord](https://discord.gg/Y4jHMCU4sv)
