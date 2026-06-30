import Link from "next/link";
import { admin } from "@/lib/supabase/admin";

export default async function HomePage() {
  const { data: rooms } = await admin
    .from("rooms")
    .select("*")
    .eq("status", "OPEN")
    .gte("apply_deadline", new Date().toISOString())
    .order("starts_at", { ascending: true });

  const now = new Date();
  const roomsWithCounts = await Promise.all(
    (rooms ?? []).map(async (room) => {
      const { count } = await admin
        .from("applications")
        .select("*", { head: true, count: "exact" })
        .eq("room_id", room.id)
        .eq("status", "CONFIRMED");
      return { ...room, confirmedCount: count ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">열린 데일리커피챗 / Open Daily Chats</h1>
        <p className="mt-2 text-stone-600">
          신청 후 호스트 검토를 통해 참가가 확정됩니다. 선착순이 아닙니다.
          <br />
          Participants are selected by host review, not first-come-first-served.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roomsWithCounts.length ? (
          roomsWithCounts.map((room) => {
            const deadlineDate = new Date(room.apply_deadline);
            const hoursLeft = (deadlineDate.getTime() - now.getTime()) / 1000 / 60 / 60;
            const soonDeadline = hoursLeft <= 24;

            return (
              <Link
                key={room.id}
                href={`/rooms/${room.id}`}
                className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm text-stone-500">열림 / Open</span>
                  {soonDeadline && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      마감 임박 / Closing soon
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold">{room.title}</h2>
                <p className="mt-1 text-sm text-stone-600">
                  호스트 / Host: {room.host_name} (@{room.host_instagram_id})
                </p>
                <p className="mt-2 text-sm">
                  날짜 / Date: {new Date(room.starts_at).toLocaleString("ko-KR")}
                </p>
                <p className="text-sm">장소 / Location: {room.place_name}</p>
                <p className="text-sm text-stone-500">{room.address}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-stone-500">
                    신청 마감: {deadlineDate.toLocaleDateString("ko-KR")}
                  </span>
                  <span className="font-medium text-stone-700">
                    확정 {room.confirmedCount} / {room.capacity}명
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            현재 열려 있는 방이 없습니다.
            <br />
            No open rooms right now.
          </div>
        )}
      </div>
    </div>
  );
}
