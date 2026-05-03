# BugFlow Local AI

A **local-only, AI-powered bug bounty workspace** that runs entirely on your MacBook. No cloud. No external APIs. All data stays on your machine.

> **Built for authorized bug bounty testing and penetration testing only.**

## 🔒 What This Is

BugFlow Local AI is a companion tool — not a hacking tool. It helps you:

- **Add bug bounty programs** and understand scope
- **Generate AI testing roadmaps** with 18 structured phases
- **Paste recon output** and get AI analysis of what's interesting
- **Track findings** with severity, status, and AI validation
- **Generate professional reports** from confirmed findings
- **Log daily sessions** and get AI summaries
- **Learn bug bounty concepts** via an AI chat assistant

## 🏗 Architecture

```
┌──────────────────────────────────┐
│  Next.js 16 (App Router)        │  ← localhost:3000
│  TypeScript + Tailwind CSS      │
│  ┌────────────────────────────┐  │
│  │  Prisma 7 + SQLite         │  │  ← prisma/dev.db (local file)
│  │  @prisma/adapter-libsql    │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  Ollama (local AI)         │──┼──→ localhost:11434
│  │  qwen2.5-coder:7b          │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Zero cloud dependencies.** No OpenAI. No Claude API. No external databases.

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **Ollama** installed ([ollama.com](https://ollama.com))
- **MacBook Air M2** 16GB or equivalent

### Setup

```bash
# 1. Clone and install
cd bug_bounty
npm install

# 2. Pull the AI model
ollama pull qwen2.5-coder:7b

# 3. Start Ollama
ollama serve

# 4. Set up the database
npx prisma db push

# 5. Start the app
npm run dev
```

Open **http://localhost:3000** in your browser.

### Environment Variables

The `.env` file is pre-configured:

```env
DATABASE_URL="file:./dev.db"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5-coder:7b"
```

## 📱 Pages & Features

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Stats overview, recent activity |
| Programs | `/programs` | List all bug bounty programs |
| Add Program | `/programs/new` | Create program + optionally generate roadmap |
| Program Detail | `/programs/[id]` | Scope summary, tabs to all sub-pages |
| Scope | `/programs/[id]/scope` | View scope rules, AI safety briefing |
| Targets | `/programs/[id]/targets` | Manage in-scope assets |
| Roadmap | `/programs/[id]/roadmap` | 18-phase testing checklist with tasks |
| Recon Notes | `/programs/[id]/recon` | Paste tool output, AI analyzes it |
| Findings | `/programs/[id]/findings` | Track bugs with AI validation |
| Reports | `/programs/[id]/reports` | Generate Markdown reports from findings |
| Daily Logs | `/logs` | Track testing sessions |
| Learning | `/learning` | AI-powered Q&A chat |
| Settings | `/settings` | Ollama connection, safety mode |
| All Targets | `/targets` | Targets across all programs |
| All Findings | `/findings` | Findings across all programs |

## 🤖 AI Features (All Local via Ollama)

1. **Roadmap Generation** — AI analyzes program scope and generates an 18-phase testing roadmap with tasks, tools, and safety warnings
2. **Recon Analysis** — Paste raw tool output (subfinder, httpx, etc.) and AI summarizes what's interesting and safe to investigate
3. **Finding Validation** — AI evaluates your finding, suggests missing evidence, and rates readiness for reporting
4. **Report Writing** — AI generates professional Markdown reports in HackerOne/Bugcrowd/Professional formats
5. **Daily Log Summary** — AI summarizes your session and suggests priorities for the next one
6. **Learning Chat** — Ask any bug bounty question and get beginner-friendly explanations

### Safety System Prompt

Every AI call includes a mandatory safety system prompt that:
- Enforces authorized-testing-only guidance
- Prohibits suggestions for destructive or out-of-scope testing
- Cannot be disabled (hardcoded in `src/lib/ollama.ts`)

## 🗄 Database Schema

13 Prisma models stored in local SQLite:

- `Program` — Bug bounty programs with scope
- `ScopeItem` — Individual scope entries
- `Target` — In-scope assets to test
- `RoadmapPhase` — AI-generated testing phases
- `RoadmapTask` — Tasks within each phase
- `ReconNote` — Pasted tool output + AI analysis
- `Finding` — Tracked vulnerabilities
- `Evidence` — Screenshots, HTTP captures, notes
- `Report` — Generated vulnerability reports
- `DailyLog` — Testing session logs
- `AiConversation` — Chat history
- `AiMessage` — Individual chat messages
- `DecisionLog` — AI decision audit trail

## 🛡 Security Posture

- **No authentication** — App runs on your private machine only
- **No external network calls** — Only localhost:11434 (Ollama)
- **No telemetry** — Zero analytics, tracking, or cloud sync
- **SQLite file** — Your data is a single file you control
- **Safety mode always on** — AI cannot suggest destructive testing

## 📁 Project Structure

```
src/
├── app/
│   ├── api/           # 20 API routes (programs, findings, AI, etc.)
│   ├── programs/      # Program pages (new, detail, roadmap, etc.)
│   ├── findings/      # Global findings view
│   ├── targets/       # Global targets view
│   ├── learning/      # AI learning chat
│   ├── logs/          # Daily session logs
│   ├── settings/      # Ollama + DB config
│   └── page.tsx       # Dashboard
├── components/
│   ├── layout/        # Sidebar
│   └── ui/            # Reusable components
└── lib/
    ├── prisma.ts      # Database client (libsql adapter)
    ├── ollama.ts      # Ollama integration + safety prompt
    ├── ai-prompts.ts  # 7 structured AI prompt builders
    └── utils.ts       # Formatting, color, parsing helpers
```

## License

Private — for personal authorized testing use only.

npx prisma db push && npx prisma generate

npm run dev

lsof -ti:3000 | xargs kill 2>/dev/null; echo "killed"
