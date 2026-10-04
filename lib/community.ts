export type Announcement = {
  id: string;
  title: string;
  body: string;
  category: "news" | "event" | "advisory";
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  is_published: boolean;
  created_at: string;
};

export const ANNOUNCEMENT_CATEGORIES: { value: Announcement["category"]; label: string }[] = [
  { value: "news", label: "News" },
  { value: "event", label: "Event" },
  { value: "advisory", label: "Advisory" },
];

export function categoryLabel(c: string) {
  return ANNOUNCEMENT_CATEGORIES.find((x) => x.value === c)?.label ?? "News";
}

export type BlotterStatus = "filed" | "under_review" | "scheduled" | "resolved" | "dismissed";

export type BlotterReport = {
  id: string;
  case_number: string | null;
  user_id: string;
  incident_type: string;
  incident_date: string;
  incident_time: string | null;
  location: string;
  respondent_name: string | null;
  narrative: string;
  status: BlotterStatus;
  hearing_at: string | null;
  admin_remarks: string | null;
  created_at: string;
  reporter_name?: string;
  reporter_email?: string;
};

export const BLOTTER_STATUSES: { value: BlotterStatus; label: string; hint: string }[] = [
  { value: "filed", label: "Filed", hint: "Received by the barangay" },
  { value: "under_review", label: "Under review", hint: "Barangay staff are looking into it" },
  { value: "scheduled", label: "Hearing scheduled", hint: "Please attend the scheduled hearing" },
  { value: "resolved", label: "Resolved", hint: "The case has been settled" },
  { value: "dismissed", label: "Dismissed", hint: "The case was closed without action" },
];

export function blotterStatusLabel(s: string) {
  return BLOTTER_STATUSES.find((x) => x.value === s)?.label ?? s;
}

export function blotterStatusClass(s: string) {
  switch (s) {
    case "filed":
      return "kb-status-pending";
    case "under_review":
    case "scheduled":
      return "kb-status-approved";
    case "resolved":
      return "kb-status-completed";
    case "dismissed":
      return "kb-status-rejected";
    default:
      return "";
  }
}

export const INCIDENT_TYPES = [
  "Noise disturbance",
  "Neighbor dispute",
  "Property damage",
  "Theft",
  "Physical altercation",
  "Verbal threat / harassment",
  "Unpaid debt",
  "Trespassing",
  "Animal-related incident",
  "Other",
];

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
