import { redirect } from "next/navigation";
import Link from "next/link";
import { admin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Room, RoomStatus } from "@/lib/types";

const statusLabel: Record<Room["status"], string> = {
  OPEN: "열림 / Open",
  FULL: "마감 / Full",
  CLOSED: "종료 / Closed",
  COMPLETED: "완료 / Completed",
  CANCELLED: "취소 / Cancelled",
};

export default async function HostDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: me } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!me || !["HOST", "ADMIN"].includes(me.role)) redirect("/");

  const { data: rooms } = await admin
    .from("rooms")
    .select("*")
    .eq("host_id", user.id)
    .order("starts_at", { ascending: false });

  const roomsWithCounts = await Promise.all(
    (rooms ?? []).map(async (room) => {
      const [{ count: applied }, { count: confirmed }] = await Promise.all([
        admin
          .from("applications")
          .select("*", { head: true, count: "exact" })
          .eq("room_id", room.id),
        admin
          .from("applications")
          .select("*", { head: true, count: "exact" })
          .eq("room_id", room.id)
          .eq("status", "CONFIRMED"),
      ]);
      return { ...room, applied: applied ?? 0, confirmed: confirmed ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 방 목록 / My Rooms</h1>
        <Link
          href="/host/new"
          className="rounded-xl bg-black px-4 py-2 text-sm text-white"
        >
          + 방 만들기 / New Room
        </Link>
      </div>

      {roomsWithCounts.length ? (
        <div className="grid gap-4">
          {roomsWithCounts.map((room) => (
            <div key={room.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 text-xs text-stone-500">{statusLabel[room.status as RoomStatus]}</div>
                  <h2 className="text-lg font-semibold">{room.title}</h2>
                  <p className="mt-1 text-sm text-stone-600">
                    {new Date(room.starts_at).toLocaleString("ko-KR")} · {room.place_name}
                  </p>
                  <p className="mt-2 text-sm">
                    신청 {room.applied}명 · 확정 {room.confirmed} / {room.capacity}명
                  </p>
                </div>
                <Link
                  href={`/host/rooms/${room.id}`}
                  className="shrink-0 rounded-lg border px-3 py-2 text-sm"
                >
                  신청자 관리 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm text-stone-500">
          아직 만든 방이 없습니다. / No rooms yet.
        </div>
      )}
    </div>
  );
}
