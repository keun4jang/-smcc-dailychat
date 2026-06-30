import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import ApplyForm from "@/components/apply-form";
import FeedbackForm from "@/components/feedback-form";
import type { Application } from "@/lib/types";

function osmUrl(lat: number, lng: number) {
  const d = 0.005;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: room } = await admin.from("rooms").select("*").eq("id", id).maybeSingle();
  if (!room) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myApplication: Application | null = null;
  if (user) {
    const { data } = await admin
      .from("applications")
      .select("*")
      .eq("room_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    myApplication = data;
  }

  const canLeaveFeedback =
    myApplication?.status === "CONFIRMED" || myApplication?.status === "ATTENDED";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-2 text-sm text-stone-500">
          {room.status === "OPEN" ? "신청 가능 / Open" : room.status === "FULL" ? "마감 / Full" : room.status}
        </div>
        <h1 className="text-3xl font-bold">{room.title}</h1>
        {room.intro ? <p className="mt-2 text-stone-600">{room.intro}</p> : null}

        <div className="mt-4 space-y-1 text-sm">
          <p>호스트 / Host: {room.host_name} (@{room.host_instagram_id})</p>
          <p>일시 / Date & Time: {new Date(room.starts_at).toLocaleString("ko-KR")}</p>
          <p>장소 / Place: {room.place_name}</p>
          <p>주소 / Address: {room.address}</p>
          <p>신청 마감 / Deadline: {new Date(room.apply_deadline).toLocaleString("ko-KR")}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a
            className="rounded-lg border px-3 py-2"
            href={`https://maps.google.com/?q=${encodeURIComponent(room.address)}`}
            target="_blank"
          >
            구글맵 / Google Maps
          </a>
          <a
            className="rounded-lg border px-3 py-2"
            href={`https://map.naver.com/v5/search/${encodeURIComponent(room.address)}`}
            target="_blank"
          >
            네이버지도 / Naver Map
          </a>
        </div>

        {room.latitude && room.longitude ? (
          <div className="mt-4 overflow-hidden rounded-xl border">
            <iframe
              title="map"
              src={osmUrl(room.latitude, room.longitude)}
              className="h-72 w-full"
            />
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">신청 / Apply</h2>

        {!user ? (
          <p className="text-sm text-stone-600">
            로그인 후 신청할 수 있습니다. / Please log in first.
          </p>
        ) : myApplication ? (
          <div className="space-y-2 text-sm">
            <p>
              내 신청 상태 / My status:{" "}
              <span className="font-semibold">
                {myApplication.status === "APPLIED" && "검토 중 / Under Review"}
                {myApplication.status === "CONFIRMED" && "참가 확정 / Confirmed ✓"}
                {myApplication.status === "WAITLIST" && "대기 중 / Waitlisted"}
                {myApplication.status === "REJECTED" && "미선정 / Not Selected"}
                {myApplication.status === "ATTENDED" && "참가 완료 / Attended"}
                {myApplication.status === "NOSHOW" && "불참 / No Show"}
              </span>
            </p>
            <p className="text-stone-500">
              신청은 선착순이 아니라 호스트 검토 후 확정됩니다. / Participation is confirmed after host review, not first-come-first-served.
            </p>
          </div>
        ) : room.status !== "OPEN" ? (
          <p className="text-sm text-stone-600">현재 신청이 마감되었습니다. / Closed.</p>
        ) : (
          <ApplyForm roomId={room.id} />
        )}
      </div>

      {canLeaveFeedback ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">참가자 의견 / Feedback</h2>
          <FeedbackForm roomId={room.id} />
        </div>
      ) : null}
    </div>
  );
}
