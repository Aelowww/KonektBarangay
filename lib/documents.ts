export type DocumentOption = {
  title: string;
  description: string;
};

export const DOCUMENTS: DocumentOption[] = [
  {
    title: "Barangay Clearance",
    description: "Required for employment, school, and legal purposes.",
  },
  {
    title: "Barangay Certificate",
    description: "A general certification issued by the barangay.",
  },
  {
    title: "Certificate of Residency",
    description: "Proof that you are a registered resident of the barangay.",
  },
  {
    title: "Certificate of Indigency",
    description: "Issued to residents who need financial assistance.",
  },
  {
    title: "Barangay Business Clearance",
    description: "Required for business registration and permits.",
  },
  {
    title: "Barangay ID Application",
    description: "Apply for an official barangay-issued ID.",
  },
  {
    title: "Certificate of Good Moral Character",
    description: "Certifies that the resident is of good moral standing.",
  },
  {
    title: "Certificate of First-Time Job Seeker",
    description: "Issued to first-time job seekers for employment purposes.",
  },
  {
    title: "Other Document Request",
    description: "Request a document not listed above by providing details.",
  },
];

export const REQUEST_STATUSES = ["pending", "approved", "completed", "rejected", "cancelled"] as const;

export function normalizeStatus(value: string | null | undefined) {
  return (value ?? "pending").toLowerCase();
}

export function formatDate(value: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = iso
    ? (() => {
        const [y, m, d] = value.split("-").map(Number);
        return new Date(y, m - 1, d);
      })()
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}
