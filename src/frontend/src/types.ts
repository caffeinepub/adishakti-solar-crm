import { PipelineStage, UserRole } from "./backend";
export { PipelineStage, UserRole };

export const PIPELINE_STAGES = [
  PipelineStage.inquiry,
  PipelineStage.surveyScheduled,
  PipelineStage.bookingConfirmed,
  PipelineStage.installation,
  PipelineStage.closedWon,
  PipelineStage.closedLost,
] as const;

export const STAGE_LABELS: Record<PipelineStage, string> = {
  [PipelineStage.inquiry]: "INQUIRY",
  [PipelineStage.surveyScheduled]: "SURVEY SCHEDULED",
  [PipelineStage.bookingConfirmed]: "BOOKING CONFIRMED",
  [PipelineStage.installation]: "INSTALLATION",
  [PipelineStage.closedWon]: "CLOSED WON",
  [PipelineStage.closedLost]: "CLOSED LOST",
};

export const STAGE_COLORS: Record<
  PipelineStage,
  { bg: string; text: string; border: string }
> = {
  [PipelineStage.inquiry]: {
    bg: "bg-blue-900/40",
    text: "text-blue-300",
    border: "border-blue-700/50",
  },
  [PipelineStage.surveyScheduled]: {
    bg: "bg-amber-900/40",
    text: "text-amber-300",
    border: "border-amber-700/50",
  },
  [PipelineStage.bookingConfirmed]: {
    bg: "bg-emerald-900/40",
    text: "text-emerald-300",
    border: "border-emerald-700/50",
  },
  [PipelineStage.installation]: {
    bg: "bg-purple-900/40",
    text: "text-purple-300",
    border: "border-purple-700/50",
  },
  [PipelineStage.closedWon]: {
    bg: "bg-green-900/40",
    text: "text-green-300",
    border: "border-green-700/50",
  },
  [PipelineStage.closedLost]: {
    bg: "bg-red-900/40",
    text: "text-red-300",
    border: "border-red-700/50",
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.admin]: "Admin",
  [UserRole.backoffice]: "Backoffice",
  [UserRole.sales]: "Sales",
  [UserRole.operation]: "Operation",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.admin]: "bg-gold/20 text-gold border-gold/30",
  [UserRole.backoffice]:
    "bg-purple-900/40 text-purple-300 border-purple-700/50",
  [UserRole.sales]: "bg-blue-900/40 text-blue-300 border-blue-700/50",
  [UserRole.operation]:
    "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
};

export const DEFAULT_DISTRICTS = [
  "Angul",
  "Balangir",
  "Balasore",
  "Bargarh",
  "Bhadrak",
  "Boudh",
  "Cuttack",
  "Deogarh",
  "Dhenkanal",
  "Gajapati",
  "Ganjam",
  "Jagatsinghpur",
  "Jajpur",
  "Jharsuguda",
  "Kalahandi",
  "Kandhamal",
  "Kendrapara",
  "Kendujhar",
  "Khordha",
  "Koraput",
  "Malkangiri",
  "Mayurbhanj",
  "Nabarangpur",
  "Nayagarh",
  "Nuapada",
  "Puri",
  "Rayagada",
  "Sambalpur",
  "Subarnapur",
  "Sundargarh",
];

export function getRoleName(role: UserRole): string {
  return ROLE_LABELS[role] ?? "Unknown";
}

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.admin;
}

export function isBackoffice(role: UserRole): boolean {
  return role === UserRole.backoffice;
}

export function isSales(role: UserRole): boolean {
  return role === UserRole.sales;
}

export function canAssignLeads(role: UserRole): boolean {
  return role === UserRole.admin || role === UserRole.backoffice;
}

export function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function formatCurrency(value: bigint): string {
  const num = Number(value);
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(0)}K`;
  return `₹${num}`;
}
