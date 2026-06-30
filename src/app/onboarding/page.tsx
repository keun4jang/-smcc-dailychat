import { upsertProfile } from "@/app/actions";

export default function OnboardingPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">프로필 입력 / Complete Profile</h1>
      <p className="text-sm text-stone-600">
        실명, 인스타 아이디, 생년월일, 성별은 운영 및 통계 목적으로 수집됩니다.
        <br />
        This data is used for safe operations and community analytics.
      </p>

      <form action={upsertProfile} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm">실명 / Real name</label>
          <input name="real_name" required className="w-full rounded-lg border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm">인스타그램 아이디 / Instagram ID</label>
          <input name="instagram_id" required className="w-full rounded-lg border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm">생년월일 / Birth date</label>
          <input type="date" name="birth_date" required className="w-full rounded-lg border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm">성별 / Gender</label>
          <select name="gender" required className="w-full rounded-lg border px-3 py-2">
            <option value="">선택 / Select</option>
            <option value="male">남성 / Male</option>
            <option value="female">여성 / Female</option>
            <option value="other">기타 / Other</option>
            <option value="prefer_not_to_say">비공개 / Prefer not to say</option>
          </select>
        </div>

        <button className="rounded-xl bg-black px-4 py-2 text-white">
          저장 / Save
        </button>
      </form>
    </div>
  );
}
