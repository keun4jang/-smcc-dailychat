import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { upsertProfile } from "@/app/actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">프로필 수정 / Edit Profile</h1>

      <form action={upsertProfile} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm">실명 / Real name</label>
          <input
            name="real_name"
            required
            defaultValue={profile?.real_name ?? ""}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">인스타그램 아이디 / Instagram ID</label>
          <input
            name="instagram_id"
            required
            defaultValue={profile?.instagram_id ?? ""}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">생년월일 / Birth date</label>
          <input
            type="date"
            name="birth_date"
            required
            defaultValue={profile?.birth_date ?? ""}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">성별 / Gender</label>
          <select
            name="gender"
            required
            defaultValue={profile?.gender ?? ""}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">선택 / Select</option>
            <option value="male">남성 / Male</option>
            <option value="female">여성 / Female</option>
            <option value="other">기타 / Other</option>
            <option value="prefer_not_to_say">비공개 / Prefer not to say</option>
          </select>
        </div>

        <div className="text-sm text-stone-500">이메일 / Email: {user.email}</div>

        <button className="rounded-xl bg-black px-4 py-2 text-white">
          저장 / Save
        </button>
      </form>
    </div>
  );
}
