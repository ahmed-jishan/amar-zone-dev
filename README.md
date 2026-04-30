# Amar Zone — Personal Life Management App

A fully **local-first** personal OS built with Next.js 14 + TypeScript.  
No backend, no database — everything lives in `localStorage`.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# → open http://localhost:3000
```

---

## Build Android APK

```bash
# Step 1: Static build
npm run build

# Step 2: Add Android (first time only — needs Android Studio)
npm run cap:add:android

# Step 3: Copy web files into Android project
npm run cap:sync

# Step 4: Open Android Studio
npm run cap:open:android

# Step 5: In Android Studio → Build → Generate Signed Bundle/APK
```

**Requirements for APK:**
- [Android Studio](https://developer.android.com/studio) installed
- Java 17+
- Android SDK

---

## Project Structure

```
amar-zone/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Root layout (fonts, metadata)
│   │   ├── page.tsx                ← Redirects to /tasks
│   │   └── (tabs)/
│   │       ├── layout.tsx          ← Bottom navigation bar
│   │       ├── tasks/page.tsx      ← Task Manager
│   │       ├── namaz/page.tsx      ← Namaz Tracker
│   │       ├── money/page.tsx      ← Money Manager
│   │       ├── analytics/page.tsx  ← Charts & Reports
│   │       └── settings/page.tsx   ← App Settings
│   │
│   ├── components/
│   │   ├── ui/                     ← Atoms: Badge, Button, Input...
│   │   ├── shared/                 ← Layout: Modal, PageHeader, EmptyState
│   │   ├── tasks/                  ← TaskCard, AddTaskModal, PomodoroTimer
│   │   ├── namaz/                  ← PrayerTimeCard, HeatmapCalendar, QiblaCompass
│   │   ├── money/                  ← TransactionList, LoanCard, SavingsGoalCard
│   │   └── analytics/              ← ExpenseChart, TaskTrendChart, PDFExportBtn
│   │
│   ├── lib/
│   │   ├── types/index.ts          ← All TypeScript interfaces
│   │   ├── store/
│   │   │   ├── taskStore.ts        ← Zustand (persisted → localStorage)
│   │   │   ├── namazStore.ts
│   │   │   ├── moneyStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── hooks/
│   │   │   ├── useTimer.ts         ← Pomodoro countdown
│   │   │   ├── useTheme.ts         ← Dark/light mode
│   │   │   └── usePrayerTimes.ts   ← Adhan prayer time calc
│   │   └── utils/
│   │       ├── helpers.ts          ← generateId, formatCurrency, cn...
│   │       ├── prayerTimes.ts      ← Adhan library wrapper
│   │       └── pdfExport.ts        ← jsPDF monthly report
│   │
│   └── styles/
│       └── globals.css             ← Tailwind + CSS variables
│
├── public/
│   ├── manifest.json               ← PWA manifest
│   ├── icons/                      ← App icons (add icon-192.png, icon-512.png)
│   └── sounds/                     ← Adhan audio (optional)
│
├── next.config.mjs                 ← Static export for Capacitor
├── tailwind.config.ts
├── tsconfig.json
└── capacitor.config.ts             ← APK build config
```

---

## Modules Roadmap

| Module     | Key Features                                              | Status |
|------------|----------------------------------------------------------|--------|
| Tasks      | Create/edit tasks, Pomodoro timer, priorities, streaks   | 🏗 Stub |
| Namaz      | 5-waqt times, reminders, heatmap, Qibla                  | 🏗 Stub |
| Money      | Income/expenses, loans, budget vs actual, savings goals  | 🏗 Stub |
| Analytics  | Bar/line/pie charts, weekly/monthly/yearly, PDF export   | 🏗 Stub |
| Settings   | Theme, language (BN/EN), PIN lock, JSON backup/restore   | 🏗 Stub |

---

## localStorage Keys

| Key                    | Store         |
|------------------------|---------------|
| `amar-zone-tasks`      | taskStore     |
| `amar-zone-namaz`      | namazStore    |
| `amar-zone-money`      | moneyStore    |
| `amar-zone-settings`   | settingsStore |

---

## Tech Stack

| Package              | Purpose                          |
|----------------------|----------------------------------|
| `next` 14            | Framework (App Router)           |
| `zustand`            | State + localStorage persistence |
| `adhan`              | Islamic prayer time calculation  |
| `recharts`           | Charts (bar, line, pie)          |
| `jspdf`              | PDF report export                |
| `lucide-react`       | Icons                            |
| `date-fns`           | Date formatting                  |
| `@capacitor/*`       | Android APK build                |
