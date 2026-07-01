"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { admin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { appendSheetRow } from "@/lib/sheets";
import type { Profile } from "@/lib/types";
import { notifyAll, notifyUsers } from "@/lib/push";

async function getMe() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}

async function getMyProfile() {
  const user = await getMe();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile };
}

function mustBeComplete(profile: Profile | null) {
  if (!profile?.profile_completed_at) redirect("/onboarding");
}

function mustHaveRole(profile: Profile | null, roles: string[]) {
  if (!profile || !roles.includes(profile.role)) redirect("/");
}

async function refreshRoomStatus(roomId: string) {
  const { data: room } = await admin.from("rooms").select("id, capacity, status, title, place_name, host_id").eq("id", roomId).single();
  const { count } = await admin
    .from("applications")
    .select("*", { head: true, count: "exact" })
    .eq("room_id", roomId)
    .eq("status", "CONFIRMED");

  if (!room) return;
  if (room.status === "CANCELLED" || room.status === "COMPLETED") return;

  const nextStatus = (count ?? 0) >= room.capacity ? "FULL" : "OPEN";
  const wasOpen = room.status === "OPEN";
  await admin.from("rooms").update({ status: nextStatus }).eq("id", roomId);

  // 방이 마감(FULL)으로 바뀐 경우 → 확정 참가자 + 호스트 + 관리자에게 알림
  if (nextStatus === "FULL" && wasOpen) {
    const [{ data: confirmed }, { data: admins }] = await Promise.all([
      admin.from("applications").select("user_id").eq("room_id", roomId).eq("status", "CONFIRMED"),
      admin.from("profiles").select("id").eq("role", "ADMIN"),
    ]);
    const targetIds = [
      room.host_id,
      ...(confirmed ?? []).map((a) => a.user_id),
      ...(admins ?? []).map((a) => a.id),
    ];
    notifyUsers([...new Set(targetIds)], {
      title: "데일리챗 마감됐어요 🔒",
      body: `${room.title} · ${room.place_name} 참가자 모집이 완료됐습니다.`,
      url: `/rooms/${roomId}`,
    }).catch(() => {});
  }
}

export async function updateUserRole(formData: FormData) {
  const { profile } = await getMyProfile();
  mustHaveRole(profile, ["ADMIN"]);

  const userId = String(formData.get("user_id"));
  const role = String(formData.get("role"));

  if (!["USER", "HOST", "ADMIN"].includes(role)) throw new Error("Invalid role");

  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function upsertProfile(formData: FormData) {
  const user = await getMe();

  const schema = z.object({
    real_name: z.string().min(2),
    instagram_id: z.string().min(2),
    birth_date: z.string().min(1),
    gender: z.string().min(1),
  });

  const parsed = schema.parse({
    real_name: formData.get("real_name"),
    instagram_id: formData.get("instagram_id"),
    birth_date: formData.get("birth_date"),
    gender: formData.get("gender"),
  });

  const payload = {
    id: user.id,
    email: user.email,
    real_name: parsed.real_name,
    instagram_id: parsed.instagram_id.replace("@", ""),
    birth_date: parsed.birth_date,
    gender: parsed.gender,
    profile_completed_at: new Date().toISOString(),
  };

  const { error } = await admin.from("profiles").upsert(payload);
  if (error) throw new Error(error.message);

  await appendSheetRow("profiles_log", [
    new Date().toISOString(),
    user.id,
    user.email ?? "",
    payload.real_name,
    payload.instagram_id,
    payload.birth_date,
    payload.gender,
  ]);

  redirect("/");
}

export async function createRoom(formData: FormData) {
  const { user, profile } = await getMyProfile();
  mustHaveRole(profile, ["HOST", "ADMIN"]);
  mustBeComplete(profile);

  const schema = z.object({
    title: z.string().min(2),
    intro: z.string().optional(),
    notes: z.string().optional(),
    starts_at: z.string().min(1),
    apply_deadline: z.string().min(1),
    place_name: z.string().min(1),
    address: z.string().min(1),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
  });

  const parsed = schema.parse({
    title: formData.get("title"),
    intro: formData.get("intro") ?? "",
    notes: formData.get("notes") ?? "",
    starts_at: formData.get("starts_at"),
    apply_deadline: formData.get("apply_deadline"),
    place_name: formData.get("place_name"),
    address: formData.get("address"),
    latitude: formData.get("latitude") ?? "",
    longitude: formData.get("longitude") ?? "",
  });

  const payload = {
    title: parsed.title,
    intro: parsed.intro || null,
    notes: parsed.notes || null,
    starts_at: parsed.starts_at,
    apply_deadline: parsed.apply_deadline,
    place_name: parsed.place_name,
    address: parsed.address,
    latitude: parsed.latitude ? Number(parsed.latitude) : null,
    longitude: parsed.longitude ? Number(parsed.longitude) : null,
    capacity: 8,
    status: "OPEN",
    host_id: user.id,
    host_name: profile.real_name,
    host_instagram_id: profile.instagram_id,
    created_by: user.id,
  };

  const { data, error } = await admin.from("rooms").insert(payload).select("id").single();
  if (error) throw new Error(error.message);

  await appendSheetRow("rooms_log", [
    new Date().toISOString(),
    data.id,
    payload.title,
    payload.starts_at,
    payload.apply_deadline,
    payload.place_name,
    payload.address,
    payload.host_name,
    payload.host_instagram_id,
  ]);

  // 새 방 생성 알림 — 전체 구독자
  notifyAll({
    title: "새 데일리챗 열렸어요! ☕",
    body: `${payload.title} · ${payload.place_name}`,
    url: `/rooms/${data.id}`,
  }).catch(() => {});

  revalidatePath("/");
  redirect(`/host/rooms/${data.id}`);
}

export async function applyToRoom(
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다. / Please log in." };

  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile?.profile_completed_at) redirect("/onboarding");

  const roomId = String(formData.get("room_id"));

  const { data: room } = await admin.from("rooms").select("*").eq("id", roomId).single();
  if (!room) return { error: "방을 찾을 수 없습니다. / Room not found." };
  if (room.status !== "OPEN") return { error: "신청이 마감된 방입니다. / Room is closed." };
  if (new Date(room.apply_deadline) < new Date()) return { error: "신청 마감 시간이 지났습니다. / Deadline has passed." };

  const { error } = await admin.from("applications").insert({
    room_id: roomId,
    user_id: user.id,
    status: "APPLIED",
  });

  if (error && error.code !== "23505") return { error: error.message };

  await appendSheetRow("applications_log", [
    new Date().toISOString(),
    roomId,
    user.id,
    profile.real_name,
    profile.instagram_id,
    "APPLIED",
  ]);

  revalidatePath(`/rooms/${roomId}`);
  redirect(`/rooms/${roomId}?applied=1`);
}

export async function updateApplicationStatus(formData: FormData) {
  const { user, profile } = await getMyProfile();
  mustHaveRole(profile, ["HOST", "ADMIN"]);

  const roomId = String(formData.get("room_id"));
  const applicationId = String(formData.get("application_id"));
  const status = String(formData.get("status"));

  const { data: room } = await admin.from("rooms").select("*").eq("id", roomId).single();
  if (!room) throw new Error("Room not found");
  if (profile.role !== "ADMIN" && room.host_id !== user.id) redirect("/");

  if (status === "CONFIRMED") {
    const { count } = await admin
      .from("applications")
      .select("*", { head: true, count: "exact" })
      .eq("room_id", roomId)
      .eq("status", "CONFIRMED");

    if ((count ?? 0) >= room.capacity) throw new Error("Room already full");
  }

  const { data: updated, error } = await admin
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  await refreshRoomStatus(roomId);

  await appendSheetRow("applications_log", [
    new Date().toISOString(),
    roomId,
    updated.user_id,
    "",
    "",
    status,
  ]);

  revalidatePath(`/host/rooms/${roomId}`);
}

export async function submitFeedback(
  _prev: { error: string; success: boolean },
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다. / Please log in.", success: false };

  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return { error: "프로필을 찾을 수 없습니다.", success: false };

  const roomId = String(formData.get("room_id"));
  const overall_rating = Number(formData.get("overall_rating"));
  const host_rating = Number(formData.get("host_rating"));
  const place_rating = Number(formData.get("place_rating"));
  const atmosphere_rating = Number(formData.get("atmosphere_rating"));
  const issue_category = String(formData.get("issue_category") ?? "");
  const comment = String(formData.get("comment") ?? "");

  const { error } = await admin.from("feedback").upsert({
    room_id: roomId,
    user_id: user.id,
    overall_rating,
    host_rating,
    place_rating,
    atmosphere_rating,
    issue_category,
    comment,
  });

  if (error) return { error: error.message, success: false };

  await appendSheetRow("feedback_log", [
    new Date().toISOString(),
    roomId,
    user.id,
    profile.real_name,
    profile.instagram_id,
    overall_rating,
    host_rating,
    place_rating,
    atmosphere_rating,
    issue_category,
    comment,
  ]);

  revalidatePath(`/rooms/${roomId}`);
  return { error: "", success: true };
}

export async function reportParticipant(formData: FormData) {
  const { user, profile } = await getMyProfile();
  mustHaveRole(profile, ["HOST", "ADMIN"]);

  const roomId = String(formData.get("room_id"));
  const reported_user_id = String(formData.get("reported_user_id"));
  const severity = String(formData.get("severity"));
  const category = String(formData.get("category"));
  const memo = String(formData.get("memo") ?? "");

  const { error } = await admin.from("participant_reports").insert({
    room_id: roomId,
    reporter_user_id: user.id,
    reported_user_id,
    severity,
    category,
    memo,
  });

  if (error) throw new Error(error.message);

  await appendSheetRow("reports_log", [
    new Date().toISOString(),
    roomId,
    user.id,
    reported_user_id,
    severity,
    category,
    memo,
  ]);

  revalidatePath(`/host/rooms/${roomId}`);
}
