import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { HostStat, ParticipantStat, ParticipantReport, Feedback } from "@/lib/types";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: me } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!me || me.role !== "ADMIN") redirect("/");

  const [{ data: hostStats }, { data: participantStats }, { data: reports }, { data: feedbacks }] =
    await Promise.all([
      admin.from("host_stats").select("*").order("rooms_created", { ascending: false }),
      admin.from("participant_stats").select("*").order("total_attended", { ascending: false }),
      admin.from("participant_reports").select("*").order("created_at", { ascending: false }).limit(20),
      admin.from("feedback").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">운영진 대시보드 / Admin Dashboard</h1>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">많이 연 호스트 / Active Hosts</h2>
        <div className="space-y-3">
          {hostStats?.map((host: HostStat) => (
            <div key={host.host_id} className="rounded-xl border p-4 text-sm">
              <p className="font-semibold">
                {host.real_name} (@{host.instagram_id})
              </p>
              <p>개설 수 / Rooms: {host.rooms_created}</p>
              <p>평균 호스트 평점 / Avg host rating: {host.avg_host_rating}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">많이 참가한 참가자 / Top Participants</h2>
        <div className="space-y-3">
          {participantStats?.map((p: ParticipantStat) => (
            <div key={p.user_id} className="rounded-xl border p-4 text-sm">
              <p className="font-semibold">
                {p.real_name} (@{p.instagram_id})
              </p>
              <p>신청 / Applied: {p.total_applications}</p>
              <p>확정 / Confirmed: {p.total_confirmed}</p>
              <p>참석 / Attended: {p.total_attended}</p>
              <p>노쇼 / No-show: {p.total_noshow}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">호스트 신고 / Host Reports</h2>
        <div className="space-y-3 text-sm">
          {reports?.length ? (
            reports.map((r: ParticipantReport) => (
              <div key={r.id} className="rounded-xl border p-4">
                <p>심각도 / Severity: {r.severity}</p>
                <p>카테고리 / Category: {r.category}</p>
                <p>메모 / Memo: {r.memo || "-"}</p>
                <p className="text-stone-500">{new Date(r.created_at).toLocaleString("ko-KR")}</p>
              </div>
            ))
          ) : (
            <p>신고 없음 / No reports</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">참가자 피드백 / Participant Feedback</h2>
        <div className="space-y-3 text-sm">
          {feedbacks?.length ? (
            feedbacks.map((f: Feedback) => (
              <div key={f.id} className="rounded-xl border p-4">
                <p>전체 / Overall: {f.overall_rating}</p>
                <p>호스트 / Host: {f.host_rating}</p>
                <p>장소 / Place: {f.place_rating}</p>
                <p>분위기 / Atmosphere: {f.atmosphere_rating}</p>
                <p>이슈 / Issue: {f.issue_category || "-"}</p>
                <p>의견 / Comment: {f.comment || "-"}</p>
                <p className="text-stone-500">{new Date(f.created_at).toLocaleString("ko-KR")}</p>
              </div>
            ))
          ) : (
            <p>피드백 없음 / No feedback</p>
          )}
        </div>
      </section>
    </div>
  );
}
