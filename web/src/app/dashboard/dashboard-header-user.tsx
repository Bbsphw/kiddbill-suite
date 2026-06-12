"use client";

import { UserButton, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";

export function DashboardHeaderUser() {
  return (
    <>
      <ClerkLoading>
        <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse ring-2 ring-white shadow-md" />
      </ClerkLoading>
      <ClerkLoaded>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox:
                "h-10 w-10 ring-2 ring-white shadow-md hover:scale-105 transition-transform duration-200",
            },
          }}
        />
      </ClerkLoaded>
    </>
  );
}
