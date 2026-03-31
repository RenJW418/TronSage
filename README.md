# ⬡ TronSage — AI-Powered TRON Intelligence Agent

> **🏆 TRON × Bank of AI Hackathon 2025 Submission**  
> Build period: March 16 – March 31, 2025

[![TRON](https://img.shields.io/badge/Network-TRON%20Mainnet-red?style=flat-square)](https://tron.network)
[![Bank of AI](https://img.shields.io/badge/Powered%20by-Bank%20of%20AI-cyan?style=flat-square)](https://bankofai.io)
[![x402](https://img.shields.io/badge/Protocol-x402%20Payment-purple?style=flat-square)](https://bankofai.io)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=flat-square)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🚀 Project Overview

**TronSage** is an AI-powered on-chain intelligence agent for the TRON ecosystem. It combines real-time whale tracking, AI-driven market analysis, DeFi opportunity monitoring, and a prediction market — all with AI services monetized through **Bank of AI's x402 micropayment protocol** supporting both **USDT and USDD** on TRON Mainnet.

### Feature Overview

| Feature | Description |
|---------|-------------|
| 🐋 **Live Whale Tracker** | Real-time USDT/USDD transfers >$100K sourced from TronScan API |
| 🤖 **AI Analyst** | Kimi AI-powered market analysis, gated by **0.1 USDT/USDD x402 payment** |
| 💼 **Portfolio Analyzer** | Full TRON wallet on-chain analysis with allocation breakdown |
| 💎 **DeFi Opportunities** | TRON protocol yield comparison (JustLend, SunSwap, Staking) |
| 🤖 **Multi-Agent Orchestration** | TronSage pays 3 specialized sub-agents via x402 micropayments to collaborate on deep analysis |
| 🔮 **Prediction Market** | Daily TRX price predictions anchored on-chain via memo transactions |
| 🔔 **Alert System** | Subscription alerts gated by real payment verification |
| 🆔 **Agent Identity** | On-chain AI agent identity via Bank of AI **8004 Protocol** |

---

## 🏗️ Bank of AI Integration

TronSage integrates **all 4** Bank of AI infrastructure layers:

### 1. x402 Payment Protocol
Supports both **USDT (6-decimal TRC20)** and **USDD (18-decimal TRC20)** tokens. The full payment flow:

```
User selects USDT or USDD in PaymentModal
  → GET /api/payment/request?token=USDT|USDD
  → Server returns payment address + amount via createX402PaymentRequest()
  → User sends 0.1 USDT/USDD to agent's TRON address
  → User submits 64-char transaction hash
  → POST /api/payment/request — verifyX402Payment() validates on TronScan
  → Proof returned to frontend as X402PaymentProof
  → AI analysis / alerts / multi-agent job unlocked
```

- **Token contracts**:
  - USDT: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` (6 decimals, raw `100000`)
  - USDD: `TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn` (18 decimals, raw `100000000000000000`)
- **Verification**: `src/lib/bankofai.ts` — `verifyX402Payment()` calls TronScan API, validates `contractRet === "SUCCESS"`, checks `trc20TransferInfo[]`, uses `BigInt` for USDD 18-decimal comparison
- **API**: `src/app/api/analyze/route.ts`, `src/app/api/alerts/route.ts` — x402-gated endpoints
- **UI**: `src/components/PaymentModal.tsx` — USDT/USDD toggle, live payment request fetch, TxHash verification

### 2. 8004 On-chain Identity
TronSage maintains a verifiable on-chain identity with live activity tracking:

- Unique agent ID: `8004-TRONSAGE-001`
- Reputation score (grows with each verified job/payment)
- Live activity log (in-memory + TronScan-anchored events)
- Achievement badges & service tier
- On-chain memo anchoring via `recordOnchainMemo()` in `src/lib/tron.ts`
- **API**: `src/app/api/identity/route.ts`
- **UI**: `src/components/AgentIdentity.tsx`

### 3. MCP Server
MCP configuration for AI tool chaining with TRON blockchain data:

- `wallet.get_balance` — TRX + TRC20 balance lookup
- `defi.get_opportunities` — TRON DeFi protocol yields
- `chain.get_events` — On-chain event feed
- **File**: `src/lib/bankofai.ts` — `getMCPServerConfig()`

### 4. Skills Modules
Integrated portfolio analysis and swap quote skills:

- `skillGetPortfolio()` — wallet portfolio data
- `skillSwapQuote()` — JustSwap quote simulation
- **File**: `src/lib/bankofai.ts`

---

## 🤖 Multi-Agent Economy

TronSage features a novel **multi-agent economic model** where the orchestrator pays sub-agents via x402 micropayments:

```
POST /api/multi-agent
  ├── Pay price-oracle agent    0.001 USDT → TRC20 transfer on TRON
  ├── Pay whale-analyst agent   0.005 USDT → TRC20 transfer on TRON
  └── Pay risk-assessor agent   0.003 USDT → TRC20 transfer on TRON
```

When `AGENT_TRON_PRIVATE_KEY` is set, payments are **real on-chain TRC20 transfers** executed server-side via TronWeb. Without a key, payments are simulated with clearly-labeled mock hashes for demo purposes.

---

## 🔮 Prediction Market with On-chain Anchoring

Daily TRX price predictions are cryptographically anchored to the TRON blockchain:

```
POST /api/prediction
  → Generate deterministic prediction digest
  → recordOnchainMemo(digest) — broadcasts 1-SUN self-transfer with memo
  → txHash stored with prediction record
  → Verifiable by anyone on TronScan
```

---

## ⚙️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        TronSage                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Next.js 14  │  │  TronScan    │  │   Bank of AI     │  │
│  │  App Router  │  │  Public API  │  │   x402 + 8004    │  │
│  │  TypeScript  │  │  TronWeb.js  │  │   MCP + Skills   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                   │             │
│  ┌──────▼─────────────────▼───────────────────▼─────────┐  │
│  │                  Next.js API Routes                   │  │
│  │  /api/whale-tracker  /api/analyze    (x402 gated)     │  │
│  │  /api/portfolio      /api/defi       /api/identity    │  │
│  │  /api/multi-agent    /api/prediction /api/alerts      │  │
│  │  /api/payment/request  /api/stats   /api/chat         │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────▼────────────────────────────┐  │
│  │                  React Components                      │  │
│  │  WhaleTracker  AIAnalyst  Portfolio  DeFi  AgentID     │  │
│  │  MultiAgentFlow  PredictionMarket  AlertSystem         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI**: Recharts, custom cyberpunk theme (Orbitron / Share Tech Mono)
- **Blockchain**: TronWeb.js (server-side), TronScan API, TronGrid API
- **AI**: Kimi (Moonshot) via OpenAI-compatible API
- **Payment**: Bank of AI x402 Protocol — USDT + USDD TRC20
- **Identity**: Bank of AI 8004 Protocol
- **Deploy**: Vercel
│  │  /api/whale-tracker  /api/analyze (x402 gated)        │  │
│  │  /api/portfolio      /api/defi    /api/identity       │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────▼────────────────────────────┐  │
│  │                  React Components                      │  │
│  │  WhaleTracker  AIAnalyst  Portfolio  DeFi  AgentID     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI**: Recharts, Framer Motion, Orbitron/Share Tech Mono fonts
- **Blockchain**: TronWeb.js, TronScan API, TronGrid API
- **AI**: OpenAI GPT-4o
- **Payment**: Bank of AI x402 Protocol (USDT TRC20)
- **Identity**: Bank of AI 8004 Protocol
- **Deploy**: Vercel (Edge Functions)

---

## 🖥️ Demo & Screenshots

**Live Demo**: [https://tron-sage.vercel.app](https://tron-sage.vercel.app)

### Feature Walkthrough

1. **Whale Tracker** — Real-time table of large USDT/USDD transfers with clickable TronScan links
2. **AI Analyst** — Enter a query → select USDT or USDD → x402 PaymentModal → send payment → submit TxHash → GPT-powered analysis
3. **Multi-Agent** — One click triggers 3 sub-agent micropayments + parallel analysis (price, whale, risk)
4. **Prediction Market** — Daily TRX price prediction anchored on-chain; PUT endpoint to resolve with actual price
5. **Portfolio** — Enter any TRON address → TRX + TRC20 token breakdown
6. **DeFi** — Protocol comparison table (JustLend, SunSwap, Staking) sortable by APY/TVL/Risk
7. **Agent ID** — TronSage's Bank of AI 8004 identity card with live reputation score & activity log

---

## 🔧 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your keys
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KIMI_API_KEY` | **Required for AI** | Moonshot (Kimi) API key for AI analysis |
| `AGENT_TRON_ADDRESS` | **Required for payments** | Your TRON wallet address to receive payments |
| `AGENT_TRON_PRIVATE_KEY` | Optional | Private key for server-side TRC20 transfers (multi-agent payments, on-chain memo anchoring) |
| `TRONGRID_API_KEY` | Optional | TronGrid API key for higher rate limits |
| `OPENAI_API_KEY` | Optional | Alternative: standard OpenAI key (if not using Kimi) |

> **Note**: Without `AGENT_TRON_PRIVATE_KEY`, the app still works — multi-agent payments are simulated with labeled mock hashes, and on-chain memo anchoring is skipped. Set `KIMI_API_KEY` + `AGENT_TRON_ADDRESS` for the full production experience.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build & Deploy

```bash
# Type-check + build
npm run build

# Deploy to Vercel
npx vercel --prod
```

---

## 📁 Project Structure

```
tron-sage/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts          # 🔐 x402-gated AI analysis (USDT + USDD)
│   │   │   ├── whale-tracker/route.ts    # 🐋 TRON whale transactions (TronScan)
│   │   │   ├── portfolio/route.ts        # 💼 Wallet portfolio data
│   │   │   ├── defi/route.ts             # 💎 DeFi opportunities
│   │   │   ├── payment/request/route.ts  # 💳 x402 payment create + verify
│   │   │   ├── multi-agent/route.ts      # 🤖 Multi-agent orchestration + micropayments
│   │   │   ├── prediction/route.ts       # 🔮 Daily predictions + on-chain anchoring
│   │   │   ├── alerts/route.ts           # 🔔 Alert subscriptions (x402 gated)
│   │   │   ├── stats/route.ts            # 📊 TRON network stats
│   │   │   ├── identity/route.ts         # 🆔 8004 agent identity
│   │   │   ├── chat/route.ts             # 💬 NLP chat interface
│   │   │   └── bot/                      # 🤖 Telegram + Feishu bot webhooks
│   │   ├── globals.css                   # Cyberpunk theme
│   │   ├── layout.tsx
│   │   └── page.tsx                      # Main dashboard
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── StatsBar.tsx
│   │   ├── WhaleTracker.tsx
│   │   ├── AIAnalyst.tsx                 # AI query + x402 payment trigger
│   │   ├── PaymentModal.tsx              # USDT/USDD token toggle + TxHash verify
│   │   ├── MultiAgentFlow.tsx
│   │   ├── PredictionMarket.tsx
│   │   ├── AlertSystem.tsx
│   │   ├── PortfolioAnalyzer.tsx
│   │   ├── DeFiOpportunities.tsx
│   │   └── AgentIdentity.tsx             # 8004 identity card
│   ├── lib/
│   │   ├── bankofai.ts                   # x402 + 8004 core integration
│   │   ├── tron.ts                       # TronScan fetch + TronWeb signing layer
│   │   └── openai.ts                     # Kimi AI client
│   └── types/
│       ├── index.ts                      # All TypeScript types
│       └── tronweb.d.ts                  # TronWeb ambient declaration
├── .env.example
├── package.json
└── README.md
```

---

## 💡 Innovation Highlights

### x402 Dual-Token Micropayment (Bank of AI)
The AI analysis endpoint implements the **full x402 payment flow** for both USDT and USDD:
1. Frontend requests payment parameters via `GET /api/payment/request?token=USDT|USDD`
2. User sends 0.1 USDT or 0.1 USDD to agent's TRON address
3. `POST /api/payment/request` with `txHash` → verified on TronScan using `BigInt` for 18-decimal USDD safety
4. `X402PaymentProof` returned and used to unlock AI services

This creates a **self-sustaining AI agent economy** — TronSage earns from every analysis request.

### Multi-Agent Economy on TRON
TronSage demonstrates a real **agent-to-agent payment** model where the orchestrator transfers USDT to sub-agents for specialized work. With a private key configured, these are actual TRC20 broadcasts — verifiable on TronScan.

### On-chain Prediction Anchoring
Daily TRX price predictions are hashed and anchored to TRON via 1-SUN self-transfer memo transactions, creating tamper-proof proof-of-prediction before the outcome is known.

### 8004 On-chain Identity
TronSage maintains a live reputation score that grows with every completed job, creating a **verifiable trust record** for the AI agent — the foundation of an AI service marketplace.

---

## 🔒 Security

- All TRON address inputs validated with regex (`/^T[a-zA-Z0-9]{33}$/`)
- Private keys never sent from frontend
- API routes use server-side only environment variables
- Payment verification uses on-chain transaction lookup (no trust required)
- No user data stored

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- **[Bank of AI](https://bankofai.io)** — x402 + 8004 infrastructure
- **[TRON Foundation](https://tron.network)** — Blockchain infrastructure  
- **[TronScan](https://tronscan.org)** — Public on-chain data API
- **[OpenAI](https://openai.com)** — GPT-4o language model

---

*Built with ❤️ for the TRON × Bank of AI Hackathon 2025*
