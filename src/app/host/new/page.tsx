import { createRoom } from "@/app/actions";

export default function HostNewPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">방 만들기 / Create Room</h1>

      <form action={createRoom} className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <label className="text-sm">
          제목 / Title
          <input name="title" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="text-sm">
          소개 / Intro
          <textarea name="intro" rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="text-sm">
          유의사항 / Notes
          <textarea name="notes" rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="text-sm">
          시작 일시 / Starts at
          <input type="datetime-local" name="starts_at" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="text-sm">
          신청 마감 / Apply deadline
          <input type="datetime-local" name="apply_deadline" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="text-sm">
          장소명 / Place name
          <input name="place_name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="text-sm">
          주소 / Address
          <input name="address" required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            위도 / Latitude
            <input name="latitude" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>

          <label className="text-sm">
            경도 / Longitude
            <input name="longitude" className="mt-1 w-full rounded-lg border px-3 py-2" />
          </label>
        </div>

        <button className="w-fit rounded-xl bg-black px-4 py-2 text-white">
          생성 / Create
        </button>
      </form>
    </div>
  );
}
