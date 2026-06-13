# Kiddbill Suite 💸

A modern monorepo development suite featuring a NestJS Backend, Next.js Frontend, and a containerized infrastructure setup.

---

## 🏗️ 5-Layer Architecture & Tech Stack

ระบบ **Kiddbill Suite** ถูกออกแบบมาด้วยสถาปัตยกรรม 5 ชั้น (5-Layer Architecture) โดยเลือกใช้เทคโนโลยีตามรายละเอียดและเวอร์ชันต่อไปนี้:

### 1. Client & Delivery Layer (ฝั่งผู้ใช้งานและส่วนหน้า)
- **Front-End Framework:** Next.js `v16.1.4` (App Router)
- **UI Library:** React `v19.2.3`
- **Language:** TypeScript `v6.0.3`
- **Styling:** Tailwind CSS `v4.1.18`
- **Components:** Radix UI `v1.4.3`
- **State Management:** Zustand `v5.0.11`
- **Data Fetching:** TanStack React Query `v5.90.20`
- **Hosting & CDN:** Vercel (Edge Network)

### 2. Gateway & Security Layer (ทางเข้าและการคัดกรอง)
- **Authentication & Authorization:** Clerk (`@clerk/nextjs v6.37.1`, `@clerk/clerk-sdk-node v5.1.6`)
- **API Security:** NestJS Throttler (`@nestjs/throttler v6.5.0`)
- **Webhook Security:** Svix `v1.84.1`

### 3. Core Logic & Data Layer (ส่วนประมวลผลและจัดเก็บข้อมูล)
- **Back-End Framework:** NestJS `v11.1.12`
- **Language:** TypeScript `v6.0.3`
- **Database ORM:** Prisma `v7.8.0`
- **Database:** PostgreSQL (Hosted on Supabase)
- **Queue & Background Jobs:** BullMQ `v5.78.0` (`@nestjs/bullmq v11.0.4`)
- **Cache / Message Broker:** Redis (Hosted on Upstash)

### 4. Integration Layer (ระบบสนับสนุนและบริการภายนอก)
- **OCR / AI Engine:** Google Gemini API
- **Object Storage:** Cloudflare R2 (S3-Compatible `aws-sdk v3.600.0`)

### 5. Infrastructure & Operations Layer (รากฐานและระบบดูแลรักษา)
- **Backend Hosting:** Koyeb (Docker Container Deployment)
- **CI/CD Pipeline:** GitHub Actions
- **Error Tracking:** Sentry (`@sentry/nextjs`, `@sentry/nestjs v10.57.0`)
- **Logging:** Pino (`nestjs-pino v4.6.1`)

---

## 📁 Repository Structure

* **[web](file:///d:/kiddbill-suite/web)**: Next.js Frontend (Tailwind CSS, Radix UI, Clerk Auth, React Query)
* **[server](file:///d:/kiddbill-suite/server)**: NestJS Backend (Prisma ORM, PostgreSQL, Clerk SDK)
* **[infra](file:///d:/kiddbill-suite/infra)**: Docker Compose configuration for PostgreSQL, pgAdmin, and containerized app profiles.

---

## 🛠️ Prerequisites

* **Docker & Docker Compose** (installed on your host machine or Ubuntu WSL2)
* **Node.js v22+** (recommended for running local development scripts)
* **pnpm** (preferred package manager)

---

## 🔗 Quick Links & Dashboards

แหล่งรวบรวมลิงก์สำคัญทั้งหมดที่ใช้ในโปรเจกต์ เพื่อให้ทีม Developer กดเข้าสู่ระบบและจัดการ Environment ต่างๆ ได้ง่ายขึ้น:

### 🏠 Local Development URLs
| Service | URL | Description |
|:---|:---|:---|
| **Frontend App** | [http://localhost:3000](http://localhost:3000) | หน้าเว็บฝั่งผู้ใช้งาน |
| **Backend API** | [http://localhost:3002](http://localhost:3002) | เส้นทางหลักของ API |
| **Swagger API Docs** | [http://localhost:3002/api/docs](http://localhost:3002/api/docs) | หน้าเอกสารและทดสอบ API ทั้งหมด (พร้อมช่องใส่ Token) |
| **API Blueprint** | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | ไฟล์เอกสารสรุป API สำหรับให้ Frontend อ่าน |
| **Prisma Studio**| [http://localhost:5555](http://localhost:5555) | ระบบจัดการ Database GUI |
| **pgAdmin 4** | [http://localhost:5050](http://localhost:5050) | จัดการ Postgres ผ่าน Docker |

### ☁️ External Services & Dashboards
| Layer | Service / Tech | Dashboard URL |
|:---|:---|:---|
| **Frontend Hosting** | Vercel | [https://vercel.com/dashboard](https://vercel.com/dashboard) |
| **Backend Hosting** | Koyeb | [https://app.koyeb.com](https://app.koyeb.com/) |
| **Database** | Supabase | [https://supabase.com/dashboard](https://supabase.com/dashboard) |
| **Cache & Queue** | Upstash (Redis) | [https://console.upstash.com](https://console.upstash.com/) |
| **Authentication** | Clerk | [https://dashboard.clerk.com](https://dashboard.clerk.com/) |
| **Object Storage** | Cloudflare R2 | [https://dash.cloudflare.com](https://dash.cloudflare.com/) |
| **AI / OCR** | Google AI Studio | [https://aistudio.google.com](https://aistudio.google.com/) |

---

## ⚙️ Environment Configuration

You must create and configure the following environment files before starting the development environment:

### 1. Infrastructure Environment File

* **Path**: [infra/.env](file:///d:/kiddbill-suite/infra/.env)
* **Required Content**:

  ```env
  DB_USER="kiddadmin"
  DB_PASSWORD="kiddpassword123"
  DB_NAME="kiddbill_db"
  DB_PORT="5433" # Mapped host port to prevent conflicts with local Postgres (5432)
  PGADMIN_EMAIL="admin@kiddbill.com"
  PGADMIN_PASSWORD="adminpassword"
  DATABASE_URL="postgresql://kiddadmin:kiddpassword123@localhost:5433/kiddbill_db?schema=public"

  # Clerk Configuration (Required for Docker-based backend)
  CLERK_SECRET_KEY="sk_test_..."
  JWKS_URL="https://.../.well-known/jwks.json"
  CLERK_JWT_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  ```

### 2. Backend Environment File

* **Path**: [server/.env](file:///d:/kiddbill-suite/server/.env)
* **Required Content**:

  ```env
  DATABASE_URL="postgresql://kiddadmin:kiddpassword123@localhost:5433/kiddbill_db?schema=public"
  CLERK_SECRET_KEY="sk_test_..."
  JWKS_URL="https://.../.well-known/jwks.json"
  CLERK_JWT_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
  ```

### 3. Frontend Environment File

* **Path**: [web/.env.local](file:///d:/kiddbill-suite/web/.env.local)
* **Required Content**:

  ```env
  NEXT_PUBLIC_API_URL="http://localhost:3002"
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
  CLERK_SECRET_KEY="sk_test_..."
  CLERK_WEBHOOK_SECRET="whsec_..."
  NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
  NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="http://localhost:3000/dashboard"
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="http://localhost:3000/dashboard"
  NEXT_PUBLIC_CLERK_ALLOWED_REDIRECT_ORIGINS="https://..."
  ```

---

## 🚀 Development Workflows & Best Practices

To ensure the best developer experience, optimal performance, and hassle-free debugging, the project supports two main workflows. We highly recommend **Workflow A (Hybrid Development)** as the industry best practice for active coding.

---

### 💡 Workflow A: Hybrid Development (Recommended / Best Practice)

* **How it works**: Runs only the PostgreSQL database (`kiddbill-db`) and pgAdmin (`kiddbill-pgadmin`) inside Docker containers on WSL2, while running the Next.js Frontend (`web`), NestJS Backend (`server`), and Prisma Studio locally on the Windows Host.
* **Why this is the Best Practice**:

  1. **Instant Hot-Reload (Fast Feedback Loop)**: Docker on WSL2 mounts Windows directories via `/mnt/...` (drvfs). File system notifications (`inotify`) are often delayed or completely lost across this mount boundary. Running Node.js locally on Windows ensures that Next.js (Webpack/Turbopack) and NestJS watch modes detect file changes instantly.
  2. **Better Resource Efficiency**: Running Node.js applications inside a Docker VM consumes significantly more RAM and CPU compared to running them natively on Windows.
  3. **Seamless Clerk Auth Integration**: Third-party authentication providers like Clerk rely on secure cookie forwarding and specific domains. Running everything locally on Windows avoids complicated network bridging and port-forwarding loops between WSL2, Docker containers, and Windows browsers.
  4. **Smooth Debugging**: You can easily attach VS Code debuggers, set breakpoints, use local DevTools, and run profiling tools directly from your Windows environment.

#### 🛠️ Setup Steps (Hybrid Mode)

1. **Start the Database Services (WSL2 / Ubuntu Terminal)**:

   Navigate to the `infra` directory and start only the base services (without the `apps` profile):

   ```bash
   cd infra
   docker compose up -d
   ```

   *This starts `kiddbill-db` (port 5433) and `kiddbill-pgadmin` (port 5050).*

2. **Run the Application via Turborepo (Windows Terminal / PowerShell)**:

   Our monorepo uses **Turborepo** for task orchestration and caching. You can start both the Next.js Frontend and NestJS Backend concurrently with a single command from the root directory:

   ```powershell
   # Install all workspace dependencies from the root
   pnpm install

   # Start both apps concurrently
   pnpm run dev
   ```

   *The Next.js app will start on [http://localhost:3000](http://localhost:3000).*
   *The NestJS server will start on [http://localhost:3002](http://localhost:3002).*

### 🎯 Turborepo Best Practices & Commands

To get the most out of our Monorepo setup, here are the standard Turborepo commands you should use from the root directory:

*   **Build Everything:** `pnpm run build` (Leverages build caching—subsequent builds are near-instant if code hasn't changed).
*   **Lint Everything:** `pnpm run lint`
*   **Format Code:** `pnpm run format`

#### Running Services Separately (Isolated Mode)

If you are focusing on a single app and want a cleaner terminal output without unnecessary resource usage, it is highly recommended to run them separately using Turborepo's filter flags:

*   **Run only Frontend:** `pnpm turbo run dev --filter=web`
*   **Run only Backend:** `pnpm turbo run dev --filter=server`

4. **Run Prisma Studio (Optional - Windows Terminal)**:

   If you need to view or edit database records through a GUI:

   ```powershell
   cd server
   npx prisma studio
   ```

   *Prisma Studio will open on [http://localhost:5555](http://localhost:5555).*

---

### 🐳 Workflow B: Fully Containerized (For Evaluation & Demo)

* **How it works**: Runs all services (PostgreSQL, pgAdmin, NestJS, Next.js, and Prisma Studio) inside Docker on WSL2 using **Docker Compose Profiles**.
* **Pros**: Zero Node.js setup required on the Windows host.
* **Cons**: High RAM overhead, slow hot-reloads due to filesystem bridging, and potential network forwarding issues (e.g., Clerk redirects failing to resolve localhost properly from container networks).

#### 🛠️ Setup Steps (Containerized Mode)

1. **Start all services with the `apps` profile (WSL2 / Ubuntu Terminal)**:

   ```bash
   cd infra
   docker compose --profile apps up -d --build
   ```

2. **Stop and clean up all services**:

   To release port bindings and RAM:

   ```bash
   docker compose --profile "*" down
   ```

---

## ⚙️ Service Ports & Access Urls

When running the project, services are mapped to the following ports:

| Service | Port | Local URL | Description | Run Location (Hybrid Mode) |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `3000` | [http://localhost:3000](http://localhost:3000) | Next.js Dev Server | Windows Host |
| **Backend API** | `3002` | [http://localhost:3002](http://localhost:3002) | NestJS Dev Server | Windows Host |
| **Swagger UI** | `3002` | [http://localhost:3002/api/docs](http://localhost:3002/api/docs) | เอกสาร Swagger ทดสอบ API | Windows Host |
| **Prisma Studio** | `5555` | [http://localhost:5555](http://localhost:5555) | Prisma Database GUI | Windows Host |
| **pgAdmin 4** | `5050` | [http://localhost:5050](http://localhost:5050) | PostgreSQL Admin GUI | WSL2 Docker Container |
| **PostgreSQL** | `5433` | `localhost:5433` | Database Port | WSL2 Docker Container |

---

## 🗄️ Database Management & Prisma Commands

Depending on your chosen workflow, Prisma commands should be executed as follows:

### Running Migrations

* **Hybrid Mode (Windows Host - Recommended)**:

  Run Prisma commands inside the `server/` directory on Windows:

  ```powershell
  cd server
  npx prisma migrate dev
  ```

* **Containerized Mode (Inside Docker)**:

  Execute Prisma commands inside the running backend container on WSL/Ubuntu:

  ```bash
  docker compose --profile apps exec kiddbill-backend npx prisma migrate dev
  ```

---

## ⚠️ Troubleshooting & Common Issues

### 1. "Cannot Open Web/Server" or "ERR_CONNECTION_REFUSED" on Host Browser

If Docker containers show as `Up` in WSL2, but you cannot open the pages in your Windows browser:

* **Clerk Redirect/CORS Conflict**: Check your [web/.env.local](file:///d:/kiddbill-suite/web/.env.local) file. If you have setup `NEXT_PUBLIC_CLERK_ALLOWED_REDIRECT_ORIGINS` to point to a tunnel (e.g. ngrok) or another custom domain, Clerk may try to redirect the browser to an inactive address.
* **WSL2 Loopback Forwarding issues**: Port forwarding between WSL2 and Windows localhost can sometimes become unstable or get blocked by firewall software.
* **Solution**: Switch to **Workflow A (Hybrid Mode)** to run Next.js and NestJS directly on Windows. This completely eliminates port-forwarding issues.

### 2. Code Changes are Not Updating (Hot-Reload Fails)

* **Root Cause**: WSL2 does not trigger `inotify` file change events inside Docker containers for files mounted from the Windows Host system (like `/mnt/d/...`).
* **Solution**: Use **Workflow A (Hybrid Mode)** to run servers directly on the Windows host, or move the entire project folder inside the native WSL2 filesystem (e.g., `/home/username/kiddbill-suite/`) instead of the mounted Windows filesystem path.

### 3. Node Modules Conflicts

* **Root Cause**: Running Node applications in different environments can conflict if native binary dependencies differ between Windows and Linux Alpine.
* **Solution**: The `docker-compose.yml` uses anonymous volumes (`/app/node_modules`) to isolate dependencies. If you add a package on Windows, rebuild the docker image:

  ```bash
  docker compose --profile "*" down
  docker compose --profile apps up -d --build
  ```
