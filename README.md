# ZEBRO / TrustLink 🛡️
> **Instagram-Embedded Social Commerce Escrow & Anti-Fraud Marketplace Shell**  
> *Built for Fintech Hackathon — Phase 1 (Instant Checkout & Live Tracker) + Phase 2 (Instagram-Embedded Marketplace Shell)*

---

## 🌟 Overview

**TrustLink (ZEBRO)** is a mobile-first social commerce escrow checkout and live tracking platform engineered to live natively inside Instagram—analogous to Facebook Marketplace living inside Facebook. It solves the rampant **purchase fraud** problem in Instagram DMs and bio storefronts:

1. **The Empty Box Scam**: Sellers ship lightweight empty boxes to generate valid tracking numbers.
2. **Ghosting / Fake Tracking**: Unverified accounts accept non-refundable transfers (Zelle, Venmo, wire) and vanish.
3. **Counterfeits & Damaged Goods**: No inspection period or recourse once money leaves the buyer's account.

TrustLink protects social commerce through **institutional-grade smart vault escrow** coupled with **hardware-level carrier postal scale telemetry** (USPS, FedEx, DHL certified tare weight audits).

---

## 📱 Phase 1 & Phase 2 Architecture

A top switcher bar in the app allows you and hackathon judges to toggle between:
- **Phase 2 (Instagram Shell)**: Flagship mobile marketplace experience living inside Instagram.
- **Phase 1 (Isolated View)**: Pure isolated instant checkout and live escrow tracker.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Instagram Shell (Phase 2)                            │
│  Top Bar: Instagram Brand + TrustLink Shield + DMs + Theme Toggle      │
├──────────────┬──────────────┬──────────────┬─────────────┬─────────────┤
│   1. Home    │  2. Explore  │  3. Orders   │  4. Inbox   │ 5. Profile  │
│ • Stories    │ • Real-time  │ • Embedded   │ • DMs &     │ • Buyer     │
│   Ticker     │   Search     │   Phase 1    │   Disputes  │   Shield    │
│ • IG Product │ • Category   │   Tracker    │ • Mismatch  │ • Seller    │
│   Cards      │   Chips      │ • Past       │   Alerts    │   Dashboard │
│ • Fraud Feed │ • 2-Col Grid │   Orders     │             │ • Trust T2  │
└──────────────┴──────────────┴──────────────┴─────────────┴─────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    Phase 1: Instant Checkout               Phase 1: Live Escrow Tracker
    • Apple Pay / Card Accordion            • Postal Scale Tare Audit
    • Seller Trust Score (98/100)           • 48-Hour Inspection Clock
    • Bento Escrow Guarantee                • Dispute & Cryptographic Proof
```

---

## ⚡ Core Anti-Fraud Innovations

### 1. Carrier Intake Physical Weight Audit (Hardware Scale Telemetry)
* When a creator drops off a package at a carrier station (USPS, FedEx, DHL), certified NIST-calibrated postal scales measure the parcel's actual mass.
* If the package deviates beyond a tight ±5% tolerance band against the seller's pre-declared weight (e.g. shipping a 0.28kg empty box for an item declared as 0.42kg), TrustLink's oracle **instantly locks and freezes the escrow smart vault**.

### 2. Neutral Smart Vault Escrow
* Funds never transfer directly to an unverified Instagram handle.
* Money is locked in an immutable smart vault (`#0x8f3a...72c21`) with cryptographic proof.
* Non-custodial disbursal occurs only upon buyer approval or expiration of the 48-hour inspection clock.

### 3. Live 48-Hour Inspection Clock Ring
* A live second-by-second ticking countdown (`47h : 58m : 24s`) gives the buyer 2 full days to unbox, inspect, and test the product.
* Buyers have dual controls: **Confirm & Release Funds Early** or **Report Issue / Freeze Escrow**.

### 4. Seller Trust Tier & Economy
* **Trust Score (88/100 · Tier 2)**: Visual progress bar toward Tier 3 (Instant Escrow Payouts) based on tare accuracy, order volume, and dispute-free history.
* **Separated Payout Ledger**: Clear distinction between *Available Balance ($420.00)* and *Locked in Escrow ($134.00)*.
* **Declared Weight Listing**: Sellers declare item weight upfront for automated carrier scale calibration.

### 5. Social Proof & Platform Defense Telemetry
* **Recently Protected Escrows Story Ticker**: Story-style horizontal feed with glowing emerald rings; tapping previews verified tare weight and on-chain hash.
* **Platform Fraud Feed**: Live counters showing frozen fraud alerts, postal scale passes, and total volume protected.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite 6 + TypeScript 5.7
- **Styling**: Tailwind CSS (true OLED dark mode `zinc-950` / `zinc-900` + light mode `slate-50`, custom emerald glow accents)
- **UI Primitives**: shadcn / Radix UI primitives (`accordion`, `dialog`, `sheet`, `popover`, `progress`, `tabs`, `tooltip`, `skeleton`)
- **Animation**: Framer Motion (animated layout transitions, carousels, spring tab indicators)
- **State Management**: Zustand (`useAppStore` for shell tabs, roles, theme, locale, demo scenarios, network toggles, and modals)
- **Async Data Layer**: TanStack Query (`@tanstack/react-query` v5 with automated caching, stale times, and scenario-driven invalidation)
- **Icons**: Lucide React (`lucide-react`)
- **Internationalization (i18n)**: English (`en`), Spanish (`es`), French (`fr`), German (`de`), Hindi (`hi`), Japanese (`ja`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Madhav-does/ZEBRO.git

# Navigate to project folder
cd ZEBRO

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Building for Production
```bash
npm run build
```

---

## 🕹️ Interactive Hackathon Demo Controller

A floating dev widget is accessible in the app:

| Demo Feature | Description |
| :--- | :--- |
| **1. Verified Delivery** | Weight matches (0.43kg vs 0.42kg). Clean escrow countdown & early release button with celebration. |
| **2. Weight Anomaly (Empty Box)** | Carrier scale flagged 0.28kg vs declared 0.42kg (-33.3%). Automated escrow freeze alert. |
| **3. Buyer Dispute Active** | Escrow funds locked in smart vault. Evidence timeline and arbitration status displayed. |
| **Simulate Offline Mode** | Simulates disconnected network with an immediate offline banner and reconnect CTA. |
| **2.5s Latency Simulation** | Demonstrates smooth skeleton loading states under slow network conditions. |
| **View Escrow Receipt** | Directly inspect the cryptographic receipt with QR code and Polygon transaction hash. |

---

## 📄 License
MIT License. Built for Fintech Hackathon.
