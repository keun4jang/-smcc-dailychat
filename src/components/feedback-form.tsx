"use client";

import { useActionState } from "react";
import { submitFeedback } from "@/app/actions";

const initialState = { error: "", success: false };

export default function FeedbackForm({ roomId }: { roomId: string }) {
  const [state, formAction, pending] = useActionState(submitFeedback, initialState);

  if (state?.success) {
    return (
      <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
        의견이 저장됐습니다. 감사합니다! / Feedback submitted. Thank you!
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="room_id" value={roomId} />

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      {(["overall", "host", "place", "atmosphere"] as const).map((key) => (
        <label key={key} className="text-sm">
          {key === "overall" && "전체 만족도 / Overall"}
          {key === "host" && "호스트 진행 / Host"}
          {key === "place" && "장소 / Place"}
          {key === "atmosphere" && "분위기 / Atmosphere"}
          <select name={`${key}_rating`} className="mt-1 w-full rounded-lg border px-3 py-2">
            <option value="5">5 ⭐⭐⭐⭐⭐</option>
            <option value="4">4 ⭐⭐⭐⭐</option>
            <option value="3">3 ⭐⭐⭐</option>
            <option value="2">2 ⭐⭐</option>
            <option value="1">1 ⭐</option>
          </select>
        </label>
      ))}

      <label className="text-sm">
        아쉬운 점 / Issue
        <select name="issue_category" className="mt-1 w-full rounded-lg border px-3 py-2">
          <option value="">없음 / None</option>
          <option value="host">호스트 진행 / Host</option>
          <option value="place">장소 / Place</option>
          <option value="atmosphere">분위기 / Atmosphere</option>
          <option value="participant">참가자 / Participant</option>
          <option value="other">기타 / Other</option>
        </select>
      </label>

      <label className="text-sm">
        자유 의견 / Comment
        <textarea name="comment" rows={4} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>

      <button
        disabled={pending}
        className="w-fit rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "저장 중..." : "의견 보내기 / Submit"}
      </button>
    </form>
  );
}
