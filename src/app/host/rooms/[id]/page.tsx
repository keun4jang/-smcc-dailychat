import { notFound, redirect } from "next/navigation";
import { admin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { reportParticipant, updateApplicationStatus } from "@/app/actions";

export default async function HostRoomManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: me } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!me || !["HOST", "ADMIN"].includes(me.role)) redirect("/");

  const { data: room } = await admin.from("rooms").select("*").eq("id", id).maybeSingle();
  if (!room) notFound();

  if (me.role !== "ADMIN" && room.host_id !== me.id) redirect("/");

  const { data: applications } = await admin
    .from("applications")
    .select("*, profiles!applications_user_id_fkey(id, real_name, instagram_id, gender, birth_date)")
    .eq("room_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{room.title}</h1>
        <p className="mt-2 text-sm text-stone-600">
          {room.place_name} · {new Date(room.starts_at).toLocaleString("ko-KR")}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">신청자 목록 / Applications</h2>

        <div className="space-y-4">
          {applications?.length ? (
            applications.map((app: any) => (
              <div key={app.id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">
                      {app.profiles?.real_name} (@{app.profiles?.instagram_id})
                    </p>
                    <p className="text-sm text-stone-500">
                      상태 / Status: {app.status}
                    </p>
                    <p className="text-xs text-stone-400">
                      신청 / Applied: {new Date(app.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {["CONFIRMED", "WAITLIST", "REJECTED", "ATTENDED", "NOSHOW"].map((status) => (
                      <form key={status} action={updateApplicationStatus}>
                        <input type="hidden" name="room_id" value={room.id} />
                        <input type="hidden" name="application_id" value={app.id} />
                        <input type="hidden" name="status" value={status} />
                        <button className="rounded-lg border px-3 py-1 text-sm">
                          {status}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-stone-600">
                    불편 참가자 표시 / Report participant
                  </summary>
                  <form action={reportParticipant} className="mt-3 grid gap-3">
                    <input type="hidden" name="room_id" value={room.id} />
                    <input type="hidden" name="reported_user_id" value={app.user_id} />

                    <select name="severity" className="rounded-lg border px-3 py-2 text-sm">
                      <option value="NOTE">참고 / Note</option>
                      <option value="WARN">주의 / Warn</option>
                      <option value="REVIEW">운영진 확인 / Review</option>
                    </select>

                    <select name="category" className="rounded-lg border px-3 py-2 text-sm">
                      <option value="late">지각 / Late</option>
                      <option value="noshow">노쇼 / No-show</option>
                      <option value="same_day_cancel">당일취소 / Same-day cancel</option>
                      <option value="attitude">태도 / Attitude</option>
                      <option value="guideline">가이드 미준수 / Guideline issue</option>
                      <option value="other">기타 / Other</option>
                    </select>

                    <textarea
                      name="memo"
                      rows={3}
                      placeholder="메모 / Memo"
                      className="rounded-lg border px-3 py-2 text-sm"
                    />

                    <button className="w-fit rounded-lg bg-black px-3 py-2 text-sm text-white">
                      신고 저장 / Save report
                    </button>
                  </form>
                </details>
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-500">아직 신청자가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
