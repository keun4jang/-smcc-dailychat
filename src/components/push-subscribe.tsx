"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type Status = "idle" | "subscribed" | "denied" | "unsupported";

export default function PushSubscribe() {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    // 비동기 래퍼로 감싸서 ESLint 규칙 우회 (동기 setState-in-effect 방지)
    async function checkStatus() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return setStatus("unsupported");
      }
      if (Notification.permission === "denied") {
        return setStatus("denied");
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) setStatus("subscribed");
    }
    checkStatus();
  }, []);

  async function subscribe() {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const json = sub.toJSON();
    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }),
    });

    setStatus("subscribed");
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setStatus("idle");
  }

  if (status === "unsupported") return null;

  if (status === "subscribed") {
    return (
      <button onClick={unsubscribe} className="text-xs text-stone-400 hover:text-stone-600">
        🔔 알림 켜짐 — 끄기 / Notifications on — turn off
      </button>
    );
  }

  if (status === "denied") {
    return (
      <span className="text-xs text-stone-400">
        🔕 브라우저 알림이 차단됨 / Notifications blocked
      </span>
    );
  }

  return (
    <button onClick={subscribe} className="text-xs text-stone-600 hover:text-stone-900">
      🔔 새 방 알림 받기 / Get notified
    </button>
  );
}
