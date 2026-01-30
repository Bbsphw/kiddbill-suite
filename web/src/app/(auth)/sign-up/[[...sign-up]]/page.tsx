// web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <SignUp fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
