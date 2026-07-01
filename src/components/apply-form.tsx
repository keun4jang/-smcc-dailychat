"use client";

import { useActionState } from "react";
import { applyToRoom } from "@/app/actions";

const initialState = { error: "" };

export default function ApplyForm({ roomId }: { roomId: string }) {
  const [state, formAction, pending] = useActionState(applyToRoom, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="room_id" value={roomId} />
      <p className="mb-3 text-sm text-stone-600">
        신청 후 호스트 검토를 통해 참가가 확정됩니다. 선착순이 아닙니다.
        <br />
        Participants are selected after host review, not first-come-first-served.
      </p>
      {state?.error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "신청 중..." : "신청하기 / Apply"}
      </button>
    </form>
  );
}
