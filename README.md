<div align="center">

# 🕌 SelfSync — Personal Life Management App

**A fully local-first personal OS for managing Tasks, Prayer (Namaz), Money & Analytics.**

Built with **Next.js 14 + TypeScript** — works offline, stores everything locally, and compiles into a native **Android APK**.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-6.0-119EFF?logo=capacitor)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[🚀 Quick Start](#quick-start) • [📱 Build APK](#build-android-apk) • [📂 Project Structure](#project-structure) • [🛠 Tech Stack](#tech-stack)

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [✅ Task Manager](#-task-manager)
  - [🕌 Namaz (Prayer) Tracker](#-namaz-prayer-tracker)
  - [💰 Money Manager](#-money-manager)
  - [📊 Analytics & Reports](#-analytics--reports)
  - [⚙️ App Settings](#-app-settings)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Build Android APK](#build-android-apk)
- [Project Structure](#project-structure)
- [Data Storage](#data-storage)
- [Environment Variables](#environment-variables)
- [Scripts](#available-scripts)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**SelfSync** (previously Amar Zone) is a **local-first** personal productivity and lifestyle management application designed for individuals who want complete control over their data. 

> 🔒 **100% Offline** — No backend server, no cloud database. All your data stays securely in your device's `localStorage`.
> 
> 📱 **Web + Mobile** — Runs as a Progressive Web App (PWA) in browsers and compiles into a native Android APK using Capacitor.
> 
> 🌙 **Islamic-Friendly** — Built-in prayer time calculations, Qibla direction, and Namaz tracking.

---

## ✨ Features

### ✅ Task Manager
A powerful task management system with focus tools:

| Feature | Description |
|---------|-------------|
| **Create & Edit Tasks** | Add tasks with title, description, category, and priority |
| **Categories** | Work, Study, Personal, Health, Other |
| **Priority Levels** | High 🔴, Medium 🟡, Low 🟢 |
| **Recurring Tasks** | Daily, Weekly, or Monthly repetition |
| **Pomodoro Timer** | Built-in focus timer (25 min work + break cycles) |
| **Task Streaks** | Track completion streaks for habit building |
| **Due Dates** | Set deadlines with date picker |
| **Archive System** | Archive completed/old tasks without deleting |
| **Multiple Views** | List view, Board view (Kanban), Timeline view |
| **Quick Add** | Floating action button for instant task creation |
| **Dashboard Toggle** | Summary dashboard with stats and next task |

**Task Status Flow:**
```
Backlog → Today → In Progress → Done → Archived
```

---

### 🕌 Namaz (Prayer) Tracker
Complete Islamic prayer management:

| Feature | Description |
|---------|-------------|
| **5 Waqt Prayer Times** | Automatic calculation for Fajr, Dhuhr, Asr, Maghrib, Isha |
| **Adhan Library** | Uses the `adhan` npm package for accurate prayer times |
| **Prayer Status** | Mark each prayer as: Pending ⏳ / Prayed ✅ / Missed ❌ / Qaza 🔄 |
| **Heatmap Calendar** | Visual calendar showing prayer consistency over time |
| **Qibla Compass** | Direction indicator towards Mecca |
| **Location-Based** | Auto-detects location for accurate timings |
| **Adhan Reminders** | Optional audio reminders before prayer time |
| **Notification Support** | Local push notifications via Capacitor |

---

### 💰 Money Manager
Comprehensive personal finance tracking:

| Feature | Description |
|---------|-------------|
| **Income & Expense Tracking** | Log transactions with categories and notes |
| **Expense Categories** | Food, Transport, Utilities, Health, Education, Entertainment, Shopping, Rent, Other |
| **Income Categories** | Salary, Freelance, Investment, Gift, Other |
| **Wallets** | Multiple wallets: Cash, Bank, Mobile, Savings |
| **Loan Manager** | Track money Given ↔ Taken with repayment history |
| **Monthly Budget** | Set budget limits per category |
| **Savings Goals** | Create goals with target amounts and deadlines |
| **Subscriptions** | Track recurring subscriptions (Netflix, etc.) |
| **Financial Insights** | Smart warnings, tips, and trend analysis |
| **Transaction Status** | Completed / Pending / Cancelled |
| **Tags & Filtering** | Add custom tags and filter transactions |

---

### 📊 Analytics & Reports
Visual insights across all modules:

| Feature | Description |
|---------|-------------|
| **Expense Charts** | Bar, Line, and Pie charts for spending analysis |
| **Task Trends** | Completion rate trends over time |
| **Time Range Filters** | Week / Month / Quarter / Year views |
| **PDF Export** | Generate monthly PDF reports using jsPDF |
| **Prayer Heatmap** | Consistency visualization for Namaz |
| **Financial Summaries** | Income vs Expense balance cards |

---

### ⚙️ App Settings
Personalization and security:

| Feature | Description |
|---------|-------------|
| **Theme** | Light / Dark / System mode |
| **Language** | English (EN) / Bengali (BN) |
| **Currency** | BDT (৳) / USD ($) / EUR (€) |
| **PIN Lock** | 4-digit PIN for app security |
| **Biometric Lock** | Fingerprint/Face ID via Capacitor Native Biometric |
| **Google Drive Backup** | Backup/restore data to Google Drive |
| **JSON Export/Import** | Manual backup as JSON file |
| **Onboarding** | First-time user tutorial |
| **Notifications** | Customizable reminder settings |

---

## 🛠 Tech Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2 | React framework with App Router |
| **React** | 18 | UI library |
| **TypeScript** | 5.0 | Type safety |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **PostCSS** | 8 | CSS processing |
| **Autoprefixer** | 10 | CSS vendor prefixes |

### State Management & Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 4.5 | Lightweight state management |
| **localStorage** | — | Persistent data storage (no backend) |

### UI & Animation
| Technology | Version | Purpose |
|------------|---------|---------|
| **Framer Motion** | 12.39 | Smooth animations & transitions |
| **Lucide React** | 0.383 | Modern icon library |
| **clsx** | 2.1 | Conditional class names |
| **tailwind-merge** | 2.3 | Tailwind class conflict resolution |

### Charts & Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | 2.12 | Interactive charts (Bar, Line, Pie) |

### PDF & Export
| Technology | Version | Purpose |
|------------|---------|---------|
| **jsPDF** | 2.5 | PDF generation |
| **jsPDF-AutoTable** | 3.8 | Table formatting in PDFs |

### Date & Time
| Technology | Version | Purpose |
|------------|---------|---------|
| **date-fns** | 3.6 | Date formatting & manipulation |
| **adhan** | 4.4 | Islamic prayer time calculations |

### QR & Barcode
| Technology | Version | Purpose |
|------------|---------|---------|
| **qrcode** | 1.5 | QR code generation |
| **@zxing/browser** | 0.1 | Barcode/QR scanning |

### Mobile / APK Build
| Technology | Version | Purpose |
|------------|---------|---------|
| **@capacitor/core** | 6.0 | Native mobile runtime |
| **@capacitor/android** | 6.0 | Android platform |
| **@capacitor/cli** | 6.0 | Capacitor CLI tools |
| **@capacitor/geolocation** | 6.0 | GPS location access |
| **@capacitor/local-notifications** | 6.0 | Push notifications |
| **@capgo/capacitor-native-biometric** | 6.0 | Fingerprint/Face ID |
| **@codetrix-studio/capacitor-google-auth** | 3.4 | Google Sign-In & Drive backup |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 8 | Code linting |
| **eslint-config-next** | 14.2 | Next.js lint rules |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- (Optional) **Android Studio** for APK build

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ahmed-jishan/amar-zone-dev.git
cd amar-zone-dev

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open in browser
# → http://localhost:3000
```

The app will automatically redirect to `/tasks` on first load.

---

## 📱 Build Android APK

### Requirements
- [Android Studio](https://developer.android.com/studio) installed
- Java 17+
- Android SDK

### Build Steps

```bash
# Step 1: Create optimized static build
npm run build

# Step 2: Add Android platform (first time only)
npm run cap:add:android

# Step 3: Sync web assets to Android project
npm run cap:sync

# Step 4: Open Android Studio
npm run cap:open:android

# Step 5: In Android Studio → Build → Generate Signed Bundle/APK
```

> 💡 **Tip:** The `cap:sync` script automatically patches Google Auth scopes, ensures Android permissions, and generates app icons.

---

## 📂 Project Structure

```
amar-zone/
├── 📁 src/
│   ├── 📁 app/                          # Next.js App Router
│   │   ├── layout.tsx                   # Root layout (fonts, metadata, theme provider)
│   │   ├── page.tsx                     # Landing page → redirects to /tasks
│   │   └── 📁 (tabs)/                   # Tab-based navigation layout
│   │       ├── layout.tsx               # Bottom navigation bar (mobile-optimized)
│   │       ├── tasks/page.tsx           # ✅ Task Manager
│   │       ├── namaz/page.tsx           # 🕌 Namaz Tracker
│   │       ├── money/page.tsx           # 💰 Money Manager
│   │       ├── analytics/page.tsx       # 📊 Analytics & Reports
│   │       └── settings/page.tsx        # ⚙️ App Settings
│   │
│   ├── 📁 components/
│   │   ├── 📁 ui/                       # Atomic components (Button, Input, Badge, Card)
│   │   ├── 📁 shared/                   # Layout components (Modal, PageHeader, EmptyState)
│   │   ├── 📁 tasks/                    # TaskCard, AddTaskModal, PomodoroTimer, TaskBoard
│   │   ├── 📁 namaz/                    # PrayerTimeCard, HeatmapCalendar, QiblaCompass
│   │   ├── 📁 money/                    # TransactionList, LoanCard, SavingsGoalCard, WalletCard
│   │   └── 📁 analytics/                # ExpenseChart, TaskTrendChart, PDFExportBtn
│   │
│   ├── 📁 lib/
│   │   ├── 📁 types/
│   │   │   ├── index.ts                 # Core types (Task, Prayer, Settings)
│   │   │   └── money.ts                 # Financial types (Transaction, Loan, Wallet, etc.)
│   │   ├── 📁 store/
│   │   │   ├── taskStore.ts             # Zustand store → localStorage (amar-zone-tasks)
│   │   │   ├── namazStore.ts            # Zustand store → localStorage (amar-zone-namaz)
│   │   │   ├── moneyStore.ts            # Zustand store → localStorage (amar-zone-money)
│   │   │   └── settingsStore.ts         # Zustand store → localStorage (amar-zone-settings)
│   │   ├── 📁 hooks/
│   │   │   ├── useTimer.ts              # Pomodoro countdown logic
│   │   │   ├── useTheme.ts              # Dark/light/system theme handler
│   │   │   └── usePrayerTimes.ts        # Adhan prayer time calculation
│   │   └── 📁 utils/
│   │       ├── helpers.ts               # generateId, formatCurrency, todayISO, cn()
│   │       ├── prayerTimes.ts           # Adhan library wrapper
│   │       └── pdfExport.ts             # jsPDF monthly report generator
│   │
│   └── 📁 styles/
│       └── globals.css                  # Tailwind + CSS variables + dark mode
│
├── 📁 public/
│   ├── manifest.json                    # PWA manifest
│   ├── icons/                           # App icons (192x192, 512x512)
│   └── sounds/                          # Adhan audio files (optional)
│
├── 📁 scripts/
│   ├── patch-google-auth-drive-scope.cjs    # Fixes Google Auth Drive scope
│   ├── generate-app-icons.cjs               # Auto-generates Android app icons
│   └── ensure-android-permissions.cjs       # Ensures required Android permissions
│
├── next.config.mjs                      # Static export config for Capacitor
├── tailwind.config.ts                   # Tailwind theme (brand colors, animations)
├── tsconfig.json                        # TypeScript configuration
├── capacitor.config.ts                  # Capacitor config (appId, plugins, Google Auth)
└── package.json                         # Dependencies & scripts
```

---

## 💾 Data Storage

All data is stored **locally** in the browser's `localStorage`. No data leaves your device.

| localStorage Key | Module | Data Type |
|------------------|--------|-----------|
| `amar-zone-tasks` | Task Manager | Tasks, streaks, pomodoro history |
| `amar-zone-namaz` | Namaz Tracker | Prayer records, settings, location |
| `amar-zone-money` | Money Manager | Transactions, loans, wallets, budgets, goals |
| `amar-zone-settings` | App Settings | Theme, language, currency, PIN, biometric |

> 🔄 **Backup:** Use Settings → Google Drive Backup or JSON Export to prevent data loss.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory for Google Auth integration:

```env
# Google OAuth (for Drive Backup & Sign-In)
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
```

> ⚠️ **Note:** These are only required if you want to enable Google Drive backup functionality.

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (with `.next` cleanup) |
| `npm run build` | Create optimized production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run icons` | Generate app icons for Android |
| `npm run cap:add:android` | Add Android platform (first time) |
| `npm run cap:sync` | Sync web build to Android + patch permissions |
| `npm run cap:open:android` | Open Android Studio |

---

## 📸 Screenshots

> *Screenshots will be added here. The app features a clean, modern UI with a bottom tab navigation optimized for mobile use.*

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Made with ❤️ by [Ahmed Jishan](https://github.com/ahmed-jishan)**

⭐ Star this repo if you find it helpful!

</div>
