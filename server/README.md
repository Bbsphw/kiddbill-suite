# Kiddbill Suite - Server (Backend) ⚙️

This is the NestJS backend application for **Kiddbill Suite**, providing robust API services, database interaction, and background job processing.

## 🛠️ Tech Stack
- **Framework:** NestJS
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL
- **Queue & Background Jobs:** BullMQ / Redis
- **Authentication:** Clerk SDK (Node)
- **Language:** TypeScript

## 🚀 Getting Started

First, ensure you have started the database containers (via `docker compose` in the `infra` folder) and configured your `.env` file according to the [Main Repository README](../README.md).

You can run the development server from the root of the monorepo using Turborepo (Recommended):
```bash
pnpm turbo run dev --filter=server
```

Or run it directly from this directory:
```bash
pnpm install
pnpm run start:dev
```

The API will be available at [http://localhost:3002](http://localhost:3002).
The Swagger API Documentation is accessible at [http://localhost:3002/api/docs](http://localhost:3002/api/docs).

## 🗄️ Database Management (Prisma)

To apply database migrations during development:
```bash
npx prisma migrate dev
```

To view and edit the database using Prisma Studio GUI:
```bash
npx prisma studio
```
(Prisma Studio will open on port `5555`)

## 🔗 Useful Links
- [Main Project README](../README.md)
- [API Documentation](../API_DOCUMENTATION.md)
