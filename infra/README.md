# Kiddbill Suite - Infrastructure (Docker & Databases) 🐳

This directory contains the Docker Compose configurations required to run the development and production environments for the **Kiddbill Suite**.

## 🛠️ Components
- **PostgreSQL (`kiddbill-db`):** The primary relational database for the application.
- **pgAdmin (`kiddbill-pgadmin`):** A web-based GUI for managing PostgreSQL.
- **NestJS Backend (`kiddbill-backend`):** Containerized API server (running under the `apps` profile).
- **Next.js Frontend (`kiddbill-frontend`):** Containerized web client (running under the `apps` profile).

## 🚀 Usage

Ensure you have created the `.env` file by copying from `.env.example`:
```bash
cp .env.example .env
```
Make sure to fill in the missing Clerk API keys if you plan to run the `apps` profile.

### 1. Hybrid Mode (Recommended for Development)
Starts only the database and pgAdmin. You will run the frontend and backend locally on your host machine for better performance and hot-reloading.
```bash
docker compose up -d
```
Stop services:
```bash
docker compose down
```

### 2. Fully Containerized Mode (apps profile)
Starts everything (Database, GUI, Backend, Frontend) in Docker.
```bash
docker compose --profile apps up -d --build
```
Stop all services (including profiles):
```bash
docker compose --profile "*" down
```

## 🔗 Useful Links
- [Main Project README](../README.md)
