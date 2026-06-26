# KiddBill Suite - CI/CD Documentation

เอกสารฉบับนี้อธิบายกระบวนการ Continuous Integration (CI) และ Continuous Deployment (CD) ของโปรเจกต์ KiddBill Suite ซึ่งเป็น Monorepo ที่ใช้เครื่องมือหลักคือ **Turborepo** และ **pnpm** ในการจัดการ

ระบบ CI/CD ทั้งหมดขับเคลื่อนด้วย **GitHub Actions** โดยแบ่งออกเป็น 2 Pipeline หลัก ได้แก่ `ci.yml` (ตรวจสอบความถูกต้องทั่วไป) และ `deploy.yml` (สำหรับ Deploy ขึ้นระบบจริง)

---

## 1. 🛠️ CI Pipeline (`.github/workflows/ci.yml`)
**จุดประสงค์:** เพื่อเป็นประตูด่านแรกในการตรวจสอบว่าโค้ดที่ Push หรือ PR เข้ามา สามารถ Compile, Test และ Build ผ่านหรือไม่ ก่อนที่จะนำไปใช้จริง

* **Triggers (เงื่อนไขการทำงาน):** `push` และ `pull_request` ไปที่ branch `main`
* **Environment:** Ubuntu (latest), Node.js v22, pnpm v9

### ขั้นตอนการทำงาน (Steps)
1. **Checkout Code:** ดึงซอร์สโค้ดล่าสุดจาก Repository
2. **Setup Environment:** ติดตั้ง `pnpm` และ `Node.js v22` พร้อมเปิดใช้งาน Caching เพื่อเพิ่มความเร็ว
3. **Install Dependencies:** รันคำสั่ง `pnpm install` เพื่อดาวน์โหลดแพ็กเกจทั้งหมด
4. **Setup Prisma:** รันคำสั่ง `pnpm db:generate` เพื่อสร้าง Prisma Client สำหรับ Database
5. **Lint and Typecheck:** รัน `pnpm turbo run lint typecheck format --continue` 
   - เช็คโค้ดตามกฎของ ESLint แบบเข้มงวด (Strict Typing)
   - เช็ค Type Errors ทั้งฝั่ง Frontend (Next.js) และ Backend (NestJS)
6. **Run Tests:** รัน `pnpm turbo run test` เพื่อทดสอบ Unit Test ทั้งหมดด้วย Jest (Backend) และ Vitest (Frontend)
7. **Build:** รัน `pnpm turbo run build` เพื่อตรวจสอบว่าโค้ดสามารถคอมไพล์เป็น Production ได้จริง
   - *หมายเหตุ:* มีการตั้งค่า `DATABASE_URL` เป็นค่าจำลอง (Mock) ป้องกันปัญหา Build พังจากการขาดฐานข้อมูล

---

## 2. 🚀 CI/CD Pipeline & Deployment (`.github/workflows/deploy.yml`)
**จุดประสงค์:** จัดการเรื่องการ Build Docker Image ฝั่ง Backend และการ Deploy ฝั่ง Frontend ขึ้น Vercel เมื่อโค้ดถูกรวมเข้า `main` อย่างสมบูรณ์แล้ว

* **Triggers (เงื่อนไขการทำงาน):** `push` และ `pull_request` ไปที่ branch `main`
* **Environment:** Ubuntu (latest), Node.js v20, pnpm v9

ไปป์ไลน์นี้จะถูกแบ่งเป็น 3 **Jobs** ทำงานตามลำดับดังนี้:

### Job 1: Lint & Type Check (`lint-and-test`)
เป็นการเช็คความเรียบร้อยของโค้ดเบื้องต้นอีกครั้งก่อนเข้าสู่ขั้นตอน Deployment
- ติดตั้ง `pnpm` (v9) และ Node.js (v20)
- รันคำสั่ง `pnpm turbo run lint` และ `pnpm turbo run typecheck`
- *หาก Job นี้ไม่ผ่าน Job ต่อไปจะไม่ทำงาน*

### Job 2: Build & Push Backend Docker Image (`build-push-backend`)
*จะทำงานเฉพาะเหตุการณ์ `push` เข้า `main` เท่านั้น*
- **Container Registry:** `ghcr.io` (GitHub Container Registry)
- **Image Name:** `${{ github.repository }}-backend`
- ทำการ Login เข้าสู่ ghcr.io โดยใช้ `GITHUB_TOKEN`
- ดึง Metadata (Tags และ Labels) อัตโนมัติจาก GitHub Actions
- รัน Docker Build ตามไฟล์ `server/Dockerfile.prod`
- Push Image ที่ Build สำเร็จขึ้นสู่ Container Registry

### Job 3: Deploy Frontend to Vercel (`deploy-frontend`)
*จะทำงานเฉพาะเหตุการณ์ `push` เข้า `main` เท่านั้น*
- ทำการติดตั้ง Vercel CLI แบบ Global
- โหลดข้อมูล Environment สำหรับ Production จาก Vercel
- รันคำสั่ง Build Project `vercel build --prod` โดยอ้างอิงจากโฟลเดอร์ `./web`
- รันคำสั่ง Deploy `vercel deploy --prebuilt --prod`
- *หมายเหตุ: ต้องมีการตั้งค่า Secrets ใน GitHub Repository คือ `VERCEL_TOKEN`, `VERCEL_ORG_ID`, และ `VERCEL_PROJECT_ID` เพื่อให้กระบวนการนี้ทำงานได้สมบูรณ์*

---

## 3. 🎯 Best Practices & Guidelines สำหรับ Developer

1. **เช็คโค้ดก่อน Commit เสมอ:**
   คุณสามารถใช้คำสั่งรวบยอดด้านล่างก่อนทำการ Push โค้ด เพื่อลดโอกาสที่ CI/CD จะไปพังบน GitHub:
   ```bash
   pnpm turbo run lint typecheck format --continue
   pnpm turbo run test
   ```

2. **ห้าม Ignore Type Errors แบบสุ่มสี่สุ่มห้า:**
   หากเจอ Error จาก `@typescript-eslint` ในบล็อก `catch (e)` หรือ `Prisma` แนะนำให้ทำการระบุ Type (เช่น `e: unknown` แล้วเช็ค `e instanceof Error`) หรือใส่ `await` ตามข้อกำหนด แทนการใช้ `// eslint-disable-next-line`

3. **การทดสอบที่เกี่ยวข้องกับฐานข้อมูล:**
   - Unit Tests ที่เรียกใช้ `PrismaService` ควรใช้ Mock Provider เสมอ เพื่อให้สามารถรัน CI/CD ได้โดยไม่ต้องพึ่งพา Database ของจริง (ตามโครงสร้างที่แก้ไว้ใน `prisma.service.spec.ts`)

---
*เอกสารนี้ถูกจัดทำขึ้นเพื่อให้ทีมพัฒนาสามารถอ้างอิงและทำความเข้าใจโครงสร้างอัตโนมัติของโปรเจกต์ได้อย่างชัดเจน*
