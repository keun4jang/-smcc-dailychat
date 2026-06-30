export type AppRole = "USER" | "HOST" | "ADMIN";
export type RoomStatus = "OPEN" | "FULL" | "CLOSED" | "COMPLETED" | "CANCELLED";
export type ApplicationStatus =
  | "APPLIED"
  | "CONFIRMED"
  | "WAITLIST"
  | "REJECTED"
  | "CANCELLED"
  | "ATTENDED"
  | "NOSHOW";
export type ReportSeverity = "NOTE" | "WARN" | "REVIEW";

export interface Profile {
  id: string;
  email: string | null;
  real_name: string | null;
  instagram_id: string | null;
  birth_date: string | null;
  gender: string | null;
  role: AppRole;
  profile_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  title: string;
  intro: string | null;
  notes: string | null;
  starts_at: string;
  apply_deadline: string;
  place_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  status: RoomStatus;
  host_id: string;
  host_name: string;
  host_instagram_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  room_id: string;
  user_id: string;
  status: ApplicationStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithProfile extends Application {
  profiles: {
    id: string;
    real_name: string | null;
    instagram_id: string | null;
    gender: string | null;
    birth_date: string | null;
  } | null;
}

export interface Feedback {
  id: string;
  room_id: string;
  user_id: string;
  overall_rating: number;
  host_rating: number | null;
  place_rating: number | null;
  atmosphere_rating: number | null;
  issue_category: string | null;
  comment: string | null;
  created_at: string;
}

export interface ParticipantReport {
  id: string;
  room_id: string;
  reporter_user_id: string;
  reported_user_id: string;
  severity: ReportSeverity;
  category: string;
  memo: string | null;
  created_at: string;
}

export interface HostStat {
  host_id: string;
  real_name: string | null;
  instagram_id: string | null;
  role: AppRole;
  rooms_created: number;
  active_or_done_rooms: number;
  avg_host_rating: number;
}

export interface ParticipantStat {
  user_id: string;
  real_name: string | null;
  instagram_id: string | null;
  total_applications: number;
  total_confirmed: number;
  total_attended: number;
  total_noshow: number;
}
