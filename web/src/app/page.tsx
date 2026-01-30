// src/app/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // ตรวจสอบ path ว่ามี button ไหม ถ้าไม่มีใช้ html button ธรรมดาได้

export default async function Home() {
  // 1. เช็คว่า Login หรือยัง
  const { userId } = await auth();

  // 2. ถ้ามี User แล้ว -> ดีดไป Dashboard ทันที
  if (userId) {
    redirect("/dashboard");
  }

  // 3. ถ้ายังไม่ Login -> โชว์หน้า Landing Page สวยๆ
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
        KiddBill 💸
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-xl">
        แอปหารค่าข้าวอัจฉริยะ เลิกปวดหัวกับการคิดเงินเพื่อน อัปโหลดสลิปปุ๊บ
        หารปั๊บ!
      </p>

      <div className="flex gap-4">
        <Link href="/sign-in">
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            เข้าสู่ระบบ (Login)
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button variant="outline" size="lg">
            สมัครสมาชิกใหม่
          </Button>
        </Link>
      </div>
    </div>
  );
}
