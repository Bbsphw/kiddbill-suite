// web/src/app/api/webhooks/clerk/route.ts

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  // 1. ตรวจสอบ Signature (Security)
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", { status: 400 });
  }

  // 2. ดึงข้อมูล User
  const eventType = evt.type;
  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    // หา email หลัก
    const primaryEmail = email_addresses.find(
      (email) => email.id === evt.data.primary_email_address_id,
    )?.email_address;

    // 3. ยิงไปหา Server NestJS (Port 3001)
    // ตรงนี้เราใช้ fetch เพื่อคุยกันระหว่าง Server-to-Server
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    try {
      await fetch(`${backendUrl}/users`, {
        // สมมติว่า route คือ /users
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // อาจจะแนบ Secret Header เพื่อความปลอดภัยเพิ่มได้
        },
        body: JSON.stringify({
          id: id,
          email: primaryEmail,
          firstName: first_name,
          lastName: last_name,
          avatarUrl: image_url,
          // map field อื่นๆ ตามต้องการ
        }),
      });
    } catch (error) {
      console.error("Failed to sync user to backend:", error);
      return new Response("Failed to sync", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
