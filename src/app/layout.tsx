import "./globals.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import SignOutButton from "@/components/sign-out-button";
import PushSubscribe from "@/components/push-subscribe";
import type { Profile } from "@/lib/types";

export const metadata = {
  title: "SMCC Daily Chat",
  description: "SMCC Daily Coffee Chat",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
    profile = data;
  }

  return (
    <html lang="ko">
      <body className="min-h-screen bg-stone-50 text-stone-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-bold">
              SMCC Daily Chat
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link href="/">모임 / Rooms</Link>
              {profile?.role === "HOST" || profile?.role === "ADMIN" ? (
                <>
                  <Link href="/host">내 방 / My Rooms</Link>
                  <Link href="/host/new">방 만들기 / New Room</Link>
                </>
              ) : null}
              {profile?.role === "ADMIN" ? <Link href="/admin">운영진 / Admin</Link> : null}
              {user ? (
                <>
                  {!profile?.profile_completed_at ? (
                    <Link href="/onboarding">프로필 입력 / Onboarding</Link>
                  ) : (
                    <Link href="/profile">프로필 / Profile</Link>
                  )}
                  <SignOutButton />
                </>
              ) : (
                <Link href="/login">로그인 / Login</Link>
              )}
            </nav>
          </div>
        </header>
        <div className="border-b bg-stone-100 py-1.5">
          <div className="mx-auto flex max-w-6xl justify-end px-4">
            <PushSubscribe />
          </div>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
