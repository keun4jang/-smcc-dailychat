"use client";

import { createClient } from "@/lib/supabase/client";

export default function AuthButtons() {
  const supabase = createClient();

  async function login(provider: "google" | "kakao") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => login("google")}
        className="rounded-xl border px-4 py-2"
      >
        구글로 시작 / Continue with Google
      </button>
      <button
        onClick={() => login("kakao")}
        className="rounded-xl bg-yellow-300 px-4 py-2"
      >
        카카오로 시작 / Continue with Kakao
      </button>
    </div>
  );
}
