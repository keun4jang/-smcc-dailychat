import Link from "next/link";
import { admin } from "@/lib/supabase/admin";

export default async function HomePage() {
  const { data: rooms } = await admin
    .from("rooms")
    .select("*")
    .eq("status", "OPEN")
    .gte("apply_deadline", new Date().toISOString())
    .order("starts_at", { ascending: true });

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
        {rooms?.length ? (
          rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow"
            >
              <div className="mb-2 text-sm text-stone-500">열림 / Open</div>
              <h2 className="text-xl font-semibold">{room.title}</h2>
              <p className="mt-1 text-sm text-stone-600">
                호스트 / Host: {room.host_name} (@{room.host_instagram_id})
              </p>
              <p className="mt-2 text-sm">
                날짜 / Date: {new Date(room.starts_at).toLocaleString("ko-KR")}
              </p>
              <p className="text-sm">장소 / Location: {room.place_name}</p>
              <p className="text-sm text-stone-500">{room.address}</p>
            </Link>
          ))
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
