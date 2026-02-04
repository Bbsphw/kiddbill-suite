// web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      {/* เพิ่ม redirectUrl เพื่อให้ Login เสร็จแล้วไปหน้า Dashboard */}
      <SignIn
        forceRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
      />
    </div>
  );
}
