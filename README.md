# 🚀 NicheFlow

**AI-powered business OS for niche small businesses in India.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![React](https://img.shields.io/badge/React-18.x-blue.svg)
![Supabase](https://img.shields.io/badge/Supabase-Edge%20Functions-green.svg)

NicheFlow is a comprehensive, AI-native operating system tailored specifically to empower niche solopreneurs and small businesses in India. It leverages a powerful suite of terminal-native coding agents to handle everything from bookings and invoicing to data digests, giving you the time to focus on what you do best.

---

## ✨ Key Features

- **🧠 Agent 0 (Orchestrator):** The brain of NicheFlow. It understands intent, routes requests, and orchestrates workflows automatically.
- **📊 Digest Agent:** Synthesizes business metrics, summarizes activities, and prepares actionable daily/weekly digests.
- **📅 Booking Agent:** Automates scheduling, syncs calendars, and manages client appointments effortlessly.
- **💳 Invoice Agent:** Generates professional invoices, handles billing workflows, and tracks payment statuses natively.
- **🚀 Ultra-fast Frontend:** Built with React 18 and Vite for internal management, and Next.js 14 for blazingly fast public pages.

---

## 🏗️ Project Architecture

NicheFlow is structured as a modern Monorepo using `pnpm`:

```text
nicheflow/
├── apps/
│   ├── web/          # React 18 + Vite 5 (Internal Management App)
│   └── public/       # Next.js 14 (Public-facing pages like /invoice/:token)
├── packages/
│   ├── ui/           # Shared UI Component Library
│   ├── agents/       # Agent logic shared across Supabase Edge Functions
│   ├── types/        # Shared TypeScript typings
│   └── utils/        # Shared utilities
└── supabase/
    ├── migrations/   # Database Migrations (Sequential SQL)
    └── functions/    # Deno Edge Functions (Backend logic & Agents)
```

---

## 🛠️ Getting Started

Follow these instructions to download, install, and run NicheFlow locally.

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (`npm i -g pnpm`)
- [Docker](https://www.docker.com/) (Required for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RiyanKothari/nicheflow.git
   cd nicheflow
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

### Running Locally

1. **Start the local Supabase environment:**
   Make sure Docker is running, then initialize and start Supabase:
   ```bash
   supabase start
   ```
   *This command will apply all migrations and spin up your local database, API, and Studio.*

2. **Start the development servers:**
   From the root of the monorepo, run:
   ```bash
   pnpm run dev
   ```
   *This will concurrently start the Vite App (`apps/web`) and the Next.js App (`apps/public`).*

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.