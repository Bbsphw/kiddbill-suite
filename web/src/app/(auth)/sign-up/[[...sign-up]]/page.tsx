// web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx

import { SignUp } from "@clerk/nextjs";

import { env } from "@/env";

export default function Page() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <SignUp
        forceRedirectUrl={env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
      />
    </div>
  );
}
