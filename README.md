# 👓 PartnerLens
### Contextual Cue Detector for Even Realities G2
**AGI House Hackathon · April 26 · Tracks: Ambient Agents + Agents with Memory**

> An ambient agent that listens to your partner's speech, detects hidden meaning from behavioral patterns, and whispers the right reply on your HUD — before you even have to think.

---

## The Problem

Your partner says *"Are you hungry?"*
They don't mean: are you hungry?
They mean: *I want to eat together — and I already know what I want.*

You suggest pizza. No. Chinese? Don't feel like it. Burrito? Too heavy.
You've been here before. PartnerLens has too. It remembers.

---

## What It Does

Listens passively via the G2's mic. Detects subtext from known behavioral patterns. Surfaces one suggested reply — silently, in under 3 seconds.

```
Partner: "Are you hungry?"
[seed match: hungry-pho, confidence 0.97]
HUD:   Say: Pho
Phone: Opens Maps → PPQ Duc Huong
```

Blank HUD otherwise. The agent is invisible until it matters.

---

## Why It Needs To Be On Your Face

A phone requires you to look down, unlock, read. The moment has passed.
The G2 HUD is peripheral — seen without breaking eye contact.
This only works as a wearable. That's the point.

---

## Architecture

```
G2 Mic (4-mic array · PCM 16kHz)
    ↓
Phone — rolling 3s transcription chunks
    ↓
Pattern Engine
  ├─ Seeded match?  → instant HUD  (no API, <100ms)
  └─ No match?      → Claude API   (<3s)
    ↓
HUD: "Say: Pho"          ← atomic clear+write, 22-char padded
Phone: Maps deeplink      ← fire and forget
```

---

## Memory Architecture

| Layer | What | Where | Mutable? |
|---|---|---|---|
| Seeded | Known partner patterns | `patterns.js` | Never |
| Learned | New patterns from runtime | `bridge.setLocalStorage` | Append-only |
| Context | Last 5 conversation turns | In-memory rolling window | Yes |

Session 1: seeds only.  
Session 3+: learned patterns fire before seeds on known triggers.  
Baseline (no memory): ~60% on known triggers. With seeds + learned: >95%.

---

## Tech Stack

| Layer | Technology |
|---|---|
| App scaffold | `@evenrealities/even_hub_sdk` · Vite + Vanilla JS |
| AI inference | Claude API · `claude-sonnet-4-20250514` |
| Audio | G2 4-mic → PCM 16kHz → phone transcription |
| Persistence | `bridge.setLocalStorage` |
| Simulator | `@evenrealities/evenhub-simulator` |
| CLI | `@evenrealities/evenhub-cli` |

---

## Toolchain

| Tool | Role |
|---|---|
| **Claude Code** (terminal) | SDK work — HUD, mic, lifecycle, simulator. Even Hub plugin gives it full SDK knowledge. |
| **Cursor** | Logic files — `engine.js`, `claude.js`, `patterns.js`. Feed RULES.md as context. |
| **Antigravity** | Boilerplate / new file scaffolding. Point at README + RULES as spec. |

**Workflow:**
```
Cursor writes logic → Claude Code wires SDK → Antigravity fills gaps → Simulator tests
```

---

## Project Structure

```
partnerlens/
├── src/
│   ├── main.js        # bridge init, lifecycle, event routing
│   ├── hud.js         # ALL display writes — hudWrite() + hudClear() only
│   ├── mic.js         # audioControl + rolling 3s transcription
│   ├── patterns.js    # seeded patterns (immutable)
│   ├── claude.js      # API call, JSON parse, fallback
│   ├── engine.js      # decision tree: seed → fuzzy → learned → infer
│   └── actions.js     # Maps deeplink + phone notifications
├── app.json           # Even Hub manifest
├── .env               # VITE_CLAUDE_API_KEY (never commit)
├── package.json
└── vite.config.js
```

---

## HUD Layout

```
┌──────────────────────┐  22 chars wide (FOV-safe)
│                      │  blank by default
│  Say: Pho            │  fires on confident match only
│                      │  auto-clears after 8 seconds
└──────────────────────┘
```

Every string padded to 22 chars with spaces — prevents ghost character overwrite bug.

---

## Setup

```bash
# 1. Check Node version — must be v20 or v22+ (v18 not supported)
node --version
nvm install 20 && nvm use 20   # if needed

# 2. Install global tools
npm install -g @evenrealities/evenhub-simulator   # v0.7.2
npm install -g @evenrealities/evenhub-cli          # v0.1.12

# 3. Install Claude Code Even Hub plugin (exact commands)
/plugin marketplace add even-realities/everything-evenhub
/plugin install everything-evenhub@everything-evenhub

# 4. Scaffold with ASR template (mic wiring included)
/template --asr partnerlens

# 5. Install SDK in project
npm install @evenrealities/even_hub_sdk   # v0.0.10

# 6. Add Claude API key
echo "VITE_CLAUDE_API_KEY=sk-ant-..." > .env

# 7. Test in simulator
/test-with-simulator

# 8. Package and upload
/build-and-deploy
```

Prerequisites: Node.js **v20 or v22+** · Even Hub app installed · G2 paired · Dev Mode enabled

---

## Useful Claude Code Commands During Build

```bash
/glasses-ui "full screen text container, isEventCapture, no border"
/handle-input "foreground enter/exit lifecycle"
/device-features "toggle mic on foreground events"
/background-state src/main.js
/sdk-reference textContainerUpgrade
/sdk-reference audioControl
/font-measurement "single line, 22 char max, 4px padding"
/simulator-automation "screenshot, verify suggestion text displayed"
```

---

## Demo Plan

1. **Simulator on laptop** — mirrors HUD for judges in real time (primary)
2. **Wear the G2** — bonus for judges who want to try hands-on
3. **Short deck** — Problem → Pattern → HUD mock → Live run

**Primary scenario:**
> Partner: "Are you hungry?" → HUD: `Say: Pho` → Phone opens Maps to PPQ

Runs on seeded path — works with no internet.

---

## Resources

- [Even Hub Docs](https://hub.evenrealities.com/docs/getting-started/overview)
- [Skill Catalog](https://hub.evenrealities.com/docs/AI-tooling/claude%20code/skill-catalog)
- [Display & UI System](https://hub.evenrealities.com/docs/guides/display)
- [Device APIs](https://hub.evenrealities.com/docs/guides/device-apis)
- [Page Lifecycle](https://hub.evenrealities.com/docs/guides/page-lifecycle)
- [SDK on npm](https://www.npmjs.com/package/@evenrealities/even_hub_sdk)
- [Design Guidelines Figma](https://www.figma.com/design/X82y5uJvqMH95jgOfmV34j/)
- [Community Discord](https://discord.gg/Y4jHMCU4sv)
