import type { Principal } from "@icp-sdk/core/principal";
import { ApprovalStatus, PipelineStage, UserRole } from "./backend";

export type { Principal };
export { PipelineStage, UserRole, ApprovalStatus };

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
  [UserRole.sales]: "Sales",
  [UserRole.operations]: "Operations",
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

export function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatCurrency(value: bigint): string {
  const num = Number(value);
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(0)}K`;
  return `₹${num}`;
}

export function truncatePrincipal(p: Principal): string {
  const s = p.toString();
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}
