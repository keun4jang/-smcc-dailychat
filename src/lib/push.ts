import "server-only";
import webpush from "web-push";
import { admin } from "@/lib/supabase/admin";

function initWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendToSubscription(sub: PushSubscription, payload: object) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch {
    // 만료된 구독은 삭제
    await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  }
}

/** 모든 구독자에게 푸시 */
export async function notifyAll(payload: { title: string; body: string; url?: string }) {
  if (!initWebPush()) return;
  const { data } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (!data?.length) return;
  await Promise.allSettled(data.map((s) => sendToSubscription(s, payload)));
}

/** 특정 유저 목록에게 푸시 */
export async function notifyUsers(
  userIds: string[],
  payload: { title: string; body: string; url?: string }
) {
  if (!initWebPush() || !userIds.length) return;
  const { data } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (!data?.length) return;
  await Promise.allSettled(data.map((s) => sendToSubscription(s, payload)));
}
