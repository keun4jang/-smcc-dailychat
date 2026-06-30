"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
      }}
      className="rounded-lg border px-3 py-1 text-sm"
    >
      로그아웃 / Sign out
    </button>
  );
}
