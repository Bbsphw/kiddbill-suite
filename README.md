# Kiddbill Suite 💸

A modern monorepo development suite featuring a NestJS Backend, Next.js Frontend, and a containerized infrastructure setup.

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
  NEXT_PUBLIC_API_URL="http://localhost:3001"
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

2. **Run the Backend (Windows Terminal / PowerShell)**:

   Navigate to the `server` directory, install dependencies, and start NestJS in dev mode:

   ```powershell
   cd server
   pnpm install
   pnpm run start:dev
   ```

   *The NestJS server will start on [http://localhost:3001](http://localhost:3001).*

3. **Run the Frontend (Windows Terminal / PowerShell)**:

   Navigate to the `web` directory, install dependencies, and start Next.js in dev mode:

   ```powershell
   cd web
   pnpm install
   pnpm run dev
   ```

   *The Next.js app will start on [http://localhost:3000](http://localhost:3000).*

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
| **Backend API** | `3001` | [http://localhost:3001](http://localhost:3001) | NestJS Dev Server | Windows Host |
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
