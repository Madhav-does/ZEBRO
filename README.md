# ZEBRO / TrustLink 🛡️
> **Instagram-Embedded Social Commerce Escrow & Anti-Fraud Marketplace Shell**  
> *Production-Ready Full-Stack Deployment: Vercel Serverless + Turso (LibSQL) + Android APK (Capacitor)*

---

## 🌟 Overview

**TrustLink (ZEBRO)** is a mobile-first social commerce escrow checkout and live tracking platform engineered to live natively inside Instagram—analogous to Facebook Marketplace living inside Facebook. It eliminates the rampant purchase fraud in social commerce DMs and bio storefronts:

1. **The Empty Box Scam**: Sellers ship lightweight empty boxes to generate valid tracking numbers.
2. **Ghosting / Fake Tracking**: Unverified accounts accept non-refundable transfers (Zelle, Venmo, wire) and vanish.
3. **Counterfeits & Damaged Goods**: No inspection period or recourse once money leaves the buyer's account.

TrustLink protects transactions through **institutional-grade smart vault escrow** coupled with **hardware-level carrier postal scale telemetry** (USPS, FedEx, DHL certified tare weight audits).

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TrustLink Client (React 18 + Vite 6)                  │
│       • Web App: Deployed on Vercel Edge Network                      │
│       • Android Native APK: Bundled via Capacitor 8                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS API Requests
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              TrustLink Backend Engine (Node.js + Fastify)               │
│       • Serverless Function Handler on Vercel Functions               │
│       • Finite State Machine (FSM) Escrow Engine                       │
│       • Hardware Postal Scale Anomaly Detection (±5% Tare Window)     │
│       • Cryptographic HMAC Webhook Verification (Stripe + EasyPost)   │
│       • JWT Role-Based Access Control & Strict IDOR Defense           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ LibSQL / HTTP Protocol
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Turso / LibSQL Distributed Database                  │
│       • Network-persistent SQLite over HTTP (Stateless-safe)          │
│       • Prisma ORM with @prisma/adapter-libsql Driver Adapter          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Java**: JDK 17 (Required for Android APK compilation)
- **Android Studio** or **Android SDK Command-Line Tools** (Optional for local web; required for compiling the Android APK)

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```
The backend will run on `http://127.0.0.1:4000` with local SQLite storage (`backend/dev.db`).

### 3. Frontend Setup
```bash
# In the project root directory
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Running Backend Security & FSM Tests
```bash
cd backend
npm test
```
Runs the full Vitest suite covering:
- 14 Escrow FSM transitions & timer rules
- 11 Red Team security & authorization checks (HMAC, IDOR, JWT validation)
- 6 End-to-End lifecycle flows & demo scenarios
- 5 Carrier tare weight audit tolerance checks

---

## 🌐 Deploying Backend to Vercel (with Turso)

> [!IMPORTANT]
> Standard local SQLite (`file:./dev.db`) cannot be used on Vercel because serverless function instances are stateless and ephemeral. For production Vercel deployment, TrustLink uses **Turso (LibSQL)**—a distributed, edge-ready SQLite database accessible over HTTP.

### Step 1: Create a Turso Database
1. Install the Turso CLI (or use the [Turso Web Dashboard](https://turso.tech)):
   ```bash
   # Windows (PowerShell):
   irm https://get.tur.so/install.ps1 | iex

   # macOS / Linux:
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
2. Log in and create the TrustLink database:
   ```bash
   turso auth login
   turso db create trustlink
   ```
3. Retrieve your database URL and authentication token:
   ```bash
   turso db show trustlink --url
   # Output: libsql://trustlink-[your-user].turso.io

   turso db tokens create trustlink
   # Output: [your-turso-jwt-auth-token]
   ```

### Step 2: Push Schema & Seed Turso Database
In `backend/.env`, configure your Turso credentials:
```env
DATABASE_URL="libsql://trustlink-[your-user].turso.io"
TURSO_DATABASE_URL="libsql://trustlink-[your-user].turso.io"
TURSO_AUTH_TOKEN="[your-turso-jwt-auth-token]"
```
Push the Prisma schema and seed the catalog into Turso:
```bash
cd backend
npx prisma db push
npm run seed
```

### Step 3: Deploy Backend to Vercel
Deploy the backend using the Vercel CLI from the `backend/` folder:
```bash
cd backend
npx vercel --prod
```
During project setup:
- Scope: Choose your personal account or team
- Link to existing project? **No**
- Project name: `trustlink-backend` (or your preferred name)
- In which directory is your code located? `./`

Add the environment variables in the Vercel Dashboard (Project Settings > Environment Variables) or via CLI:
```bash
npx vercel env add TURSO_DATABASE_URL production
npx vercel env add TURSO_AUTH_TOKEN production
npx vercel env add JWT_SECRET production
npx vercel env add API_SECRET production
npx vercel env add STRIPE_WEBHOOK_SECRET production
npx vercel env add EASYPOST_WEBHOOK_SECRET production
npx vercel env add CORS_ORIGIN production
```
*(Set `CORS_ORIGIN` to your deployed frontend Vercel domain, e.g. `https://trustlink-frontend.vercel.app`)*

---

## 💻 Deploying Frontend to Vercel

### Step 1: Set Production API Endpoint
In `.env.production` (or Vercel project environment variables), point the frontend to your deployed backend URL:
```env
VITE_API_BASE_URL=https://trustlink-backend.vercel.app/api/v1
VITE_USE_MOCK_API=false
VITE_INSPECTION_WINDOW_SECONDS=48
```

### Step 2: Deploy Frontend
From the root directory:
```bash
npx vercel --prod
```
- Scope: Choose your account
- Link to existing project? **No**
- Project name: `trustlink-frontend`
- Output directory: `dist`
- Build command: `npm run build`

---

## 📱 Building Android APK with Capacitor

TrustLink is configured with Capacitor to generate a standalone Android native application that bundles the production frontend assets and communicates with the live backend API.

### App Identity & Configuration
- **Package ID / Application ID**: `com.trustlink.app`
- **App Name**: `TrustLink`
- **Web Directory**: `dist`
- **Android Scheme**: `https` (`https://localhost` origin for secure cookie & CORS compliance)
- **Permissions**: `android.permission.INTERNET` (configured in `android/app/src/main/AndroidManifest.xml`)

---

### Option A: Build APK Using Android Studio (Recommended)

1. Open the native Android project in Android Studio:
   ```bash
   npm run cap:open
   # or
   npx cap open android
   ```
2. Wait for Android Studio to finish Gradle sync and download any required Android SDK platforms (Android 14 / API 34).
3. From the top menu, click:
   **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
4. Once compilation completes, Android Studio displays a notification: `APK(s) generated successfully for 1 module`.
   Click **locate** to find `app-debug.apk`.
   The APK is located at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

### Option B: Build APK Using Command Line (CLI)

If you have `ANDROID_HOME` or `ANDROID_SDK_ROOT` configured in your environment:

1. Create or verify `android/local.properties` pointing to your Android SDK:
   ```properties
   ## Example for Windows:
   sdk.dir=C:\\Users\\[YourUser]\\AppData\\Local\\Android\\Sdk

   ## Example for macOS:
   # sdk.dir=/Users/[YourUser]/Library/Android/sdk

   ## Example for Linux:
   # sdk.dir=/home/[YourUser]/Android/Sdk
   ```
2. Run the build command:
   ```bash
   npm run cap:build
   ```
   Or execute directly:
   ```bash
   # Windows:
   cd android && gradlew.bat assembleDebug

   # macOS / Linux:
   cd android && ./gradlew assembleDebug
   ```
3. The compiled debug APK will be created at:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

### 🔄 How to Rebuild the APK After Frontend Changes

Whenever you modify React components, styles, or business logic, follow these 3 steps to update the Android app:

```bash
# 1. Rebuild production web assets
npm run build

# 2. Sync web assets into native Android project
npx cap sync android

# 3. Rebuild the APK (via CLI or in Android Studio)
npm run cap:build
```
*(Or simply run `npm run cap:sync` followed by rebuilding in Android Studio).*

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default (Dev) | Production (Vercel) |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | SQLite / LibSQL Connection URL | `file:./dev.db` | `libsql://your-db.turso.io` |
| `TURSO_DATABASE_URL` | Turso HTTP Database URL | *(unset)* | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso JWT Authentication Token | *(unset)* | `[turso-auth-token]` |
| `PORT` | Local HTTP Port | `4000` | *(handled by Vercel)* |
| `HOST` | Local Binding Interface | `127.0.0.1` | *(handled by Vercel)* |
| `JWT_SECRET` | Secret key for signing user auth tokens | `jwt_dev_secret_2026` | High-entropy random string |
| `API_SECRET` | Secret key for internal admin API access | `api_dev_secret_2026` | High-entropy random string |
| `STRIPE_WEBHOOK_SECRET` | HMAC signature secret for Stripe webhooks | `whsec_mock_stripe_2026` | Stripe webhook secret |
| `EASYPOST_WEBHOOK_SECRET`| HMAC signature secret for EasyPost webhooks | `ep_whsec_test_secret_2026` | EasyPost webhook secret |
| `CORS_ORIGIN` | Comma-separated allowed frontend domains | `http://localhost:5173` | Your Vercel frontend URL |
| `INSPECTION_WINDOW_SECONDS`| Escrow auto-release inspection window | `48` | `48` |

### Frontend (`.env` / `.env.production`)

| Variable | Description | Default (Dev) | Production (Vercel / APK) |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Fastify backend API endpoint URL | `http://localhost:4000/api/v1` | `https://your-backend.vercel.app/api/v1` |
| `VITE_USE_MOCK_API` | Bypass backend and use in-memory mock client | `false` | `false` |
| `VITE_INSPECTION_WINDOW_SECONDS` | Escrow countdown timer duration | `48` | `48` |

---

## 🕹️ Interactive Hackathon Demo Controller

A floating demo control widget is available in both web and native Android APK builds:

| Demo Feature | Description |
| :--- | :--- |
| **1. Verified Delivery** | Carrier tare weight matches within ±5% tolerance (e.g. 0.43kg vs 0.42kg). Unlocks 48-hour inspection clock & early release button. |
| **2. Weight Anomaly (Empty Box)** | Carrier postal scale flags 0.28kg vs declared 0.42kg (-33.3%). Escrow smart vault automatically freezes with proof modal. |
| **3. Buyer Dispute Active** | Escrow funds locked in smart vault pending evidence submission and administrative arbitration. |
| **Simulate Offline Mode** | Simulates disconnected network with an immediate offline banner and reconnect CTA. |
| **2.5s Latency Simulation** | Demonstrates smooth skeleton loading states under simulated mobile 3G network conditions. |
| **View Escrow Receipt** | Directly inspect the cryptographic receipt with QR code and blockchain transaction hash. |

---

## 📄 License
MIT License. Built for Fintech Hackathon.
