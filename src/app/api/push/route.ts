import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();
  const { endpoint, p256dh, auth } = body;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await admin.from("push_subscriptions").upsert(
    { user_id: user?.id ?? null, endpoint, p256dh, auth },
    { onConflict: "endpoint" }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { endpoint } = body;
  if (endpoint) {
    await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
  return NextResponse.json({ ok: true });
}
