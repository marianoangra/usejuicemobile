# Juice Mobile — DePIN on Solana for Latin America

> **Colosseum Solana Hackathon 2025**

**Juice Mobile is a DePIN protocol on Solana that pays users in tokens for verified phone charging sessions — no hardware required, every proof on-chain, built for Latin America.**

---

## The Problem

Mobile DePIN has a hardware problem.

Helium requires a $400 hotspot. Hivemapper requires a dashcam. STEPN requires sneaker NFTs. The entry barrier is physical and financial — which means the people who need the income most are the least able to participate.

Brazil crystallizes this gap:
- **220M smartphones** — nearly one per person
- **PIX** processes more transactions than Visa — payments are solved
- **60M+ unbanked** people, with Android phones
- **Zero DePIN protocols** designed to run on hardware they already own

---

## The Solution

Your phone is the node. Charging is the proof-of-work.

```
1. User opens Juice Mobile and plugs in their phone
2. Battery API detects charging — foreground service starts
3. Every verified minute  →  +10 JUICE tokens
4. Every completed hour   →  +50 JUICE bonus
5. Session ends           →  Solana Memo written on-chain (immutable proof)
6. User claims JUICE to any Solana wallet, or withdraws via PIX
```

No hardware purchase. No NFT. No seed phrase at onboarding.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER DEVICE                         │
│  React Native (Expo)                                    │
│  ├── Battery API foreground service                     │
│  ├── Charging state detection (real-time)               │
│  └── Device fingerprint (anti-fraud)                    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│               FIREBASE (Backend)                        │
│  Firestore ── user profiles, sessions, withdrawals      │
│  Cloud Functions ──                                     │
│  ├── registrarProvasSessao  → writes Solana Memo        │
│  ├── onReferreeBecameActive → anti-fraud + referral     │
│  └── resgatarCNB            → SPL token transfer        │
└──────────────────────┬──────────────────────────────────┘
                       │ @solana/web3.js
┌──────────────────────▼──────────────────────────────────┐
│                   SOLANA MAINNET                        │
│  Memo Program  ── session proofs (immutable)            │
│  SPL Token     ── JUICE token transfers                 │
│  Token: Ew92cAS3PmGqeNvUjsDCwHoVsiGeLSynFnzpdLTx2pu4  │
└─────────────────────────────────────────────────────────┘
```

**On-chain proof format (Solana Memo):**
```json
{
  "app": "Juice Mobile",
  "event": "session",
  "uidHash": "a3f9c2...",
  "ts": "2025-05-11T14:22:00Z",
  "dur": 60,
  "pts": 650
}
```

Every proof is publicly auditable. No trust required.

---

## Repository Structure

```
usejuicemobile/
├── app/              # React Native mobile app (Expo)
│   ├── src/
│   │   ├── screens/       # UI screens
│   │   ├── services/      # Firebase, Solana, analytics
│   │   ├── hooks/         # useCarregamento (charging logic)
│   │   └── context/       # Auth, theme
│   └── functions/         # Firebase Cloud Functions (Node.js 22)
│       └── index.js       # All backend logic
│
├── web/              # Landing page + dashboard (Next.js 14)
│   ├── app/               # App router pages
│   ├── components/        # UI components
│   └── public/            # Assets
│
└── README.md
```

---

## Tokenomics

| Parameter | Value |
|---|---|
| Token | JUICE (SPL, Solana Mainnet) |
| Total Supply | 21,000,000,000 JUICE — fixed |
| Mint Authority | Renounced |
| Emission | 650 JUICE / hour of verified charging |
| Halving | Every 4 years (Bitcoin-inspired) |
| Burn | 2% of every token redemption |
| Min. Claim | 100,000 JUICE |

---

## Why Solana

- **Cost:** $0.00025 per Memo transaction. At 10,000 daily session proofs → $2.50/day in protocol infrastructure.
- **Speed:** Sub-second finality. Session ends → Memo confirmed → user notified. Invisible to the user.
- **Mobile:** Mobile Wallet Adapter for React Native is production-ready. Phantom / Solflare in two taps.
- **Ecosystem:** Solana Seeker (150k preorders) is exactly our user base — mobile-first, crypto-native, expecting their phone to pay them.

Ore proved the formula at Renaissance 2024. We extend that thesis from computation to **attention**.

---

## Traction

This is not a hackathon prototype.

| Metric | Number |
|---|---|
| Monthly active users (Firebase Analytics) | **7,600** |
| Weekly active users | **4,900** |
| Daily active users (today) | **2,000** |
| Active right now | **124** |
| Registered accounts | **3,491** |
| Users with 60+ verified minutes | **1,369** |
| Total minutes verified on-chain | **4,492,033 min (74,867 h)** |
| Total points generated | **99,761,359** |
| Daily Solana Memo proofs | **20** |
| PIX withdrawal requests | **69** |
| CNB token redemptions | **12** |
| Active affiliates | **338** |
| Peak daily charging users | **1,312** (May 9) — **12x growth in 20 days** |

Every proof exists on mainnet today. [Verify on Solscan →](https://solscan.io/tx/2Bkui44aPDVC5TdF3mg8RsytKQWmEzXcABVKA6kiZSzdreeZUP4K6q7Za53YYYvR73Bj9hj1ihbcVDdbMsPwao8y)

---

## Security

Juice Mobile implements production-grade anti-fraud:

- **Device fingerprinting** (SHA-256 of stable device characteristics)
- **Circular referral detection** — graph traversal up to 15 levels
- **IP correlation** — flags shared IPs between referrer/referee
- **On-chain proofs** — every session is immutable, no retroactive manipulation
- **60-minute activation threshold** — referral bonuses require 1h of real usage
- **Firestore Security Rules** — server-enforced, no client-side bypass

---

## Quick Start

### Mobile App
```bash
cd app
npm install
npx expo start
```

### Web
```bash
cd web
npm install
npm run dev
```

---

## Team

Built by **Rafael Mariano** — Brazil 🇧🇷

> *"We didn't build Juice Mobile for a hackathon. We built it for Brazil, before this hackathon existed."*

---

## Links

- **Token on Solscan:** [Ew92cAS3PmGqeNvUjsDCwHoVsiGeLSynFnzpdLTx2pu4](https://solscan.io/token/Ew92cAS3PmGqeNvUjsDCwHoVsiGeLSynFnzpdLTx2pu4)
- **Live Dashboard:** [usejuicemobile.com](https://usejuicemobile.com)
- **Contact:** contato@criptonobolso.com.br

---

*Ore mines CPU. STEPN mines movement. **Juice Mobile mines attention** — the most abundant and least compensated resource in the digital economy, in the market that needs it most.*
