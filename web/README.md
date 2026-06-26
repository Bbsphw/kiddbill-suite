# Kiddbill Suite - Web (Frontend) 🌐

This is the Next.js frontend application for **Kiddbill Suite**, built with the latest Next.js App Router.

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router)
- **UI & Styling:** Tailwind CSS, Radix UI
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query
- **Authentication:** Clerk Auth
- **Language:** TypeScript

## 🚀 Getting Started

First, ensure you have set up your `.env.local` file according to the instructions in the [Main Repository README](../README.md).

You can run the development server from the root of the monorepo using Turborepo (Recommended):
```bash
pnpm turbo run dev --filter=web
```

Or you can run it directly from this directory:
```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure
- `src/app` - Next.js App Router pages and layouts.
- `src/components` - Reusable React components (UI and Feature-specific).
- `src/hooks` - Custom React hooks.
- `src/lib` - Utility functions, API clients, and configurations.
- `src/store` - Zustand state stores.

## 🔗 Useful Links
- [Main Project README](../README.md)
- [API Documentation](../API_DOCUMENTATION.md)
