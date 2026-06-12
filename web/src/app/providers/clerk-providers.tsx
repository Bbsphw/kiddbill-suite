// web/src/app/providers/providers.tsx

"use client";

import { ClerkProvider } from "@clerk/nextjs";

export default function ClerkProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  );
}
