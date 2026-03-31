# ⬡ TronSage — AI-Powered TRON Intelligence Agent

> **🏆 TRON × Bank of AI Hackathon 2025 Submission**  
> Build period: March 16 – March 31, 2025

[![TRON](https://img.shields.io/badge/Network-TRON%20Mainnet-red?style=flat-square)](https://tron.network)
[![Bank of AI](https://img.shields.io/badge/Powered%20by-Bank%20of%20AI-cyan?style=flat-square)](https://bankofai.io)
[![x402](https://img.shields.io/badge/Protocol-x402%20Payment-purple?style=flat-square)](https://bankofai.io)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=flat-square)](https://nextjs.org)

**[README in Chinese](./README.md)** | **English Version**

---

## 🚀 Quick Overview

**TronSage** is an AI agent that combines real-time whale tracking, market analysis, DeFi intelligence, and prediction market — all monetized via **Bank of AI's x402 protocol** supporting USDT + USDD micropayments.

### Core Features
- 🐋 **Whale Tracker** — Real-time large TRON transfers
- 🤖 **AI Analysis** — Market insights (0.1 USDT/USDD per query)
- 💼 **Portfolio** — Wallet asset breakdown
- 🤖 **Multi-Agent** — Sub-agents via x402 payments
- 🔮 **Predictions** — Daily TRX forecasts anchored on-chain
- 🆔 **8004 Identity** — On-chain reputation system

---

## 🔧 Setup

```bash
git clone https://github.com/your-username/tron-sage.git
cd tron-sage
npm install
cp .env.example .env.local
npm run dev
```

**Required env vars:**
- `KIMI_API_KEY` — Moonshot AI access
- `AGENT_TRON_ADDRESS` — Your TRON wallet (receives payments)

**Deploy to Vercel:**
```bash
npm run build
npx vercel --prod
```

---

*Built for TRON × Bank of AI Hackathon 2025*
