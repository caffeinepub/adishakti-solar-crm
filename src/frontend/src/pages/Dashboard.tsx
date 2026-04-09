import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BookCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardPen,
  Clock,
  Edit2,
  Eye,
  FileText,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lead, QuotationRequest } from "../backend";
import { PipelineStage, QuotationRequestStatus, UserRole } from "../backend";
import { KPICard } from "../components/KPICard";
import { Layout } from "../components/Layout";
import { LeadCard } from "../components/LeadCard";
import { LeadModal } from "../components/LeadModal";
import { StageBadge } from "../components/StageBadge";
import { StageModal } from "../components/StageModal";
import { useAuth } from "../hooks/useAuth";
import {
  useAddLead,
  useAddRemark,
  useAllDistricts,
  useAllLeads,
  useAllUsers,
  useConfirmQuotationRequest,
  useGetPendingQuotationRequests,
  useGetSalesLeadGenerationToggle,
  useLeadsAddedToday,
  useMyLeads,
  useRequestQuotation,
  useTotalLeadsCount,
  useUpdateLead,
  useUpdateLeadStage,
} from "../hooks/useQueries";
import {
  PIPELINE_STAGES,
  STAGE_COLORS,
  STAGE_LABELS,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../types";

// ── Pending Quotation Requests Panel ──────────────────────────────────────────

interface PendingQuotationPanelProps {
  allLeads: Lead[];
  allUsers: { userId: string; name: string }[];
}

function PendingQuotationPanel({
  allLeads,
  allUsers,
}: PendingQuotationPanelProps) {
  const { data: pendingRequests = [], isLoading } =
    useGetPendingQuotationRequests();
  const confirm = useConfirmQuotationRequest();

  const getLeadName = (leadId: bigint) =>
    allLeads.find((l) => l.id === leadId)?.customerName ?? "—";
  const getLeadDistrict = (leadId: bigint) =>
    allLeads.find((l) => l.id === leadId)?.district ?? "—";
  const getSalesName = (userId: string) =>
    allUsers.find((u) => u.userId === userId)?.name ?? userId;

  const handleConfirm = async (req: QuotationRequest) => {
    if (
      !window.confirm(`Confirm quotation sent for ${getLeadName(req.leadId)}?`)
    )
      return;
    try {
      await confirm.mutateAsync(req.id);
      toast.success("Quotation confirmed! Lead moved to Quotation Sent.");
    } catch {
      toast.error("Failed to confirm quotation.");
    }
  };

  return (
    <div
      className="mb-6 rounded-lg border border-amber-700/50 bg-amber-950/20 overflow-hidden"
      data-ocid="backoffice.pending_quotation_panel"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/40 bg-amber-900/20">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-300">
            Pending Quotation Requests
          </h2>
          {pendingRequests.length > 0 && (
            <span
              className="bg-amber-500 text-[#0A1220] text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1"
              data-ocid="backoffice.pending_badge"
            >
              {pendingRequests.length}
            </span>
          )}
        </div>
        <span className="text-[10px] text-amber-400/70">
          Auto-refreshes every 30s
        </span>
      </div>

      {/* Panel body */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full bg-amber-900/20" />
            ))}
          </div>
        ) : pendingRequests.length === 0 ? (
          <div
            className="flex flex-col items-center py-6 gap-2 text-amber-400/60"
            data-ocid="backoffice.pending_quotation_empty"
          >
            <CheckCircle2 className="w-8 h-8" />
            <p className="text-sm font-medium">No pending quotation requests</p>
            <p className="text-xs">
              Sales staff quotation requests will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-700/30">
                  {[
                    "Customer",
                    "District",
                    "Sales Person",
                    "Quotation Ref ID",
                    "Requested At",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-400/70"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-amber-700/20 hover:bg-amber-900/10 transition-colors"
                    data-ocid={`backoffice.quotation_request_row.${req.id}`}
                  >
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      {getLeadName(req.leadId)}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {getLeadDistrict(req.leadId)}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {req.requestedByName || getSalesName(req.requestedBy)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-amber-300 text-xs bg-amber-900/30 px-2 py-0.5 rounded border border-amber-700/40">
                        {req.quotationRefId}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(req.requestedAt)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-700 text-white hover:bg-emerald-600 font-semibold"
                        onClick={() => handleConfirm(req)}
                        disabled={confirm.isPending}
                        data-ocid={`backoffice.confirm_quotation.${req.id}`}
                      >
                        {confirm.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        Confirm Sent
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sales Lead Card with quick actions ───────────────────────────────────────

interface SalesLeadCardProps {
  lead: Lead;
  onView: (lead: Lead) => void;
  pendingRequestLeadIds: Set<string>;
}

// Post-survey "quotation needed?" prompt state
type QuotPromptState = "idle" | "asking" | "ref_input";

function SalesLeadCard({
  lead,
  onView,
  pendingRequestLeadIds,
}: SalesLeadCardProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [quotRefOpen, setQuotRefOpen] = useState(false);
  const [quotRef, setQuotRef] = useState("");
  const [quotSent, setQuotSent] = useState(false);
  // Inline post-survey prompt
  const [quotPrompt, setQuotPrompt] = useState<QuotPromptState>("idle");
  const [promptQuotRef, setPromptQuotRef] = useState("");

  const updateStage = useUpdateLeadStage();
  const addRemark = useAddRemark();
  const requestQuotation = useRequestQuotation();

  const hasPendingRequest =
    pendingRequestLeadIds.has(lead.id.toString()) || quotSent;

  const isSurveyDone = lead.stage === PipelineStage.surveyScheduled;
  const canMarkSurvey =
    lead.stage === PipelineStage.inquiry ||
    lead.stage === PipelineStage.surveyScheduled;

  const handleSurveyDone = async () => {
    if (isSurveyDone) return;
    try {
      await updateStage.mutateAsync({
        id: lead.id,
        stage: PipelineStage.surveyScheduled,
        notes: "Survey completed",
      });
      await addRemark.mutateAsync({
        leadId: lead.id,
        content: "Survey completed",
      });
      toast.success("Survey marked as done!");
      // After success, show inline quotation prompt
      setQuotPrompt("asking");
      setNoteOpen(false);
      setQuotRefOpen(false);
    } catch {
      toast.error("Failed to update stage.");
    }
  };

  const handlePromptYes = () => {
    setQuotPrompt("ref_input");
    setPromptQuotRef("");
  };

  const handlePromptNo = () => {
    setQuotPrompt("idle");
  };

  const handlePromptSubmit = async () => {
    if (!promptQuotRef.trim()) return;
    try {
      await requestQuotation.mutateAsync({
        leadId: lead.id,
        quotationRefId: promptQuotRef.trim(),
      });
      setPromptQuotRef("");
      setQuotPrompt("idle");
      setQuotSent(true);
      toast.success(
        "Quotation request sent! Awaiting backoffice confirmation.",
      );
    } catch {
      toast.error("Failed to request quotation.");
    }
  };

  const handleBookingConfirm = async () => {
    if (!window.confirm("Confirm this booking?")) return;
    try {
      await updateStage.mutateAsync({
        id: lead.id,
        stage: PipelineStage.bookingConfirmed,
        notes: "Booking confirmed by sales",
      });
      await addRemark.mutateAsync({
        leadId: lead.id,
        content: "Booking confirmed by sales",
      });
      toast.success("Booking confirmed!");
    } catch {
      toast.error("Failed to confirm booking.");
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addRemark.mutateAsync({
        leadId: lead.id,
        content: noteText.trim(),
      });
      setNoteText("");
      setNoteOpen(false);
      toast.success("Note saved!");
    } catch {
      toast.error("Failed to save note.");
    }
  };

  const handleRequestQuotation = async () => {
    if (!quotRef.trim()) return;
    try {
      await requestQuotation.mutateAsync({
        leadId: lead.id,
        quotationRefId: quotRef.trim(),
      });
      setQuotRef("");
      setQuotRefOpen(false);
      setQuotSent(true);
      toast.success(
        "Quotation request sent! Awaiting backoffice confirmation.",
      );
    } catch {
      toast.error("Failed to request quotation.");
    }
  };

  const isBusy =
    updateStage.isPending || addRemark.isPending || requestQuotation.isPending;

  return (
    <div
      className="bg-card border border-border rounded-lg p-3 flex flex-col gap-2"
      data-ocid="sales.lead_card"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {lead.customerName}
          </p>
          <p className="text-xs text-muted-foreground">{lead.phone}</p>
          <p className="text-[10px] text-muted-foreground">{lead.district}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StageBadge stage={lead.stage} />
          <button
            type="button"
            onClick={() => onView(lead)}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View lead"
            data-ocid="sales.view_lead.button"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pending quotation notice */}
      {hasPendingRequest && (
        <div
          className="flex items-center gap-1.5 text-[10px] bg-amber-900/20 border border-amber-700/40 text-amber-300 rounded px-2 py-1.5"
          data-ocid="sales.quotation_pending_notice"
        >
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span className="font-semibold">
            Quotation Request Sent — awaiting backoffice confirmation
          </span>
        </div>
      )}

      {/* Post-survey "Quotation needed?" inline prompt */}
      {quotPrompt === "asking" && (
        <div
          className="rounded border border-cyan-700/50 bg-cyan-950/20 px-3 py-2.5 flex flex-col gap-2"
          data-ocid="sales.quotation_prompt"
        >
          <p className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            Survey done! Is a quotation needed for this customer?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePromptYes}
              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded border bg-cyan-700/40 text-cyan-200 border-cyan-600/60 hover:bg-cyan-700/60 transition-colors"
              data-ocid="sales.quotation_prompt_yes.button"
            >
              <ThumbsUp className="w-3 h-3" />
              Yes, request quotation
            </button>
            <button
              type="button"
              onClick={handlePromptNo}
              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded border bg-muted text-muted-foreground border-border hover:bg-muted/70 transition-colors"
              data-ocid="sales.quotation_prompt_no.button"
            >
              <ThumbsDown className="w-3 h-3" />
              No, not now
            </button>
          </div>
        </div>
      )}

      {/* Post-survey quotation ref input (triggered from prompt) */}
      {quotPrompt === "ref_input" && (
        <div
          className="rounded border border-cyan-700/50 bg-cyan-950/20 px-3 py-2.5 flex flex-col gap-2"
          data-ocid="sales.quotation_prompt_ref"
        >
          <p className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wide">
            Enter Quotation Reference ID
          </p>
          <input
            type="text"
            value={promptQuotRef}
            onChange={(e) => setPromptQuotRef(e.target.value)}
            placeholder="e.g. QT-2024-001"
            className="bg-muted border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-cyan-500/50"
            data-ocid="sales.quotation_prompt_ref_input"
            onKeyDown={(e) => {
              if (e.key === "Enter") handlePromptSubmit();
              if (e.key === "Escape") setQuotPrompt("asking");
            }}
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs bg-cyan-700 text-white hover:bg-cyan-600 font-semibold"
              onClick={handlePromptSubmit}
              disabled={requestQuotation.isPending || !promptQuotRef.trim()}
              data-ocid="sales.quotation_prompt_submit.button"
            >
              {requestQuotation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : null}
              Submit Request
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setQuotPrompt("asking")}
            >
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
        {/* Survey Done — shown for inquiry stage only; once done it's hidden */}
        {canMarkSurvey && !isSurveyDone && (
          <button
            type="button"
            disabled={isBusy}
            onClick={handleSurveyDone}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border transition-colors bg-amber-900/30 text-amber-300 border-amber-700/50 hover:bg-amber-900/50"
            data-ocid="sales.survey_done.button"
          >
            {isBusy ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            Survey Done
          </button>
        )}

        {/* Survey completed label — shown once marked done */}
        {isSurveyDone && (
          <span
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border bg-amber-900/20 text-amber-400 border-amber-700/40 opacity-70 cursor-default"
            data-ocid="sales.survey_completed_label"
          >
            <CheckCircle2 className="w-3 h-3" />
            Survey Completed
          </span>
        )}

        {/* Mark Booking Confirmed */}
        {lead.stage !== PipelineStage.bookingConfirmed &&
          lead.stage !== PipelineStage.closedWon &&
          lead.stage !== PipelineStage.closedLost && (
            <button
              type="button"
              disabled={isBusy}
              onClick={handleBookingConfirm}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border bg-emerald-900/30 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/50 transition-colors"
              data-ocid="sales.booking_confirm.button"
            >
              {isBusy ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <BookCheck className="w-3 h-3" />
              )}
              Mark Booking
            </button>
          )}

        {/* Request Quotation button — hidden if prompt active, already pending/sent, or in terminal stages */}
        {quotPrompt === "idle" &&
          !hasPendingRequest &&
          lead.stage !== PipelineStage.quotationSent &&
          lead.stage !== PipelineStage.bookingConfirmed &&
          lead.stage !== PipelineStage.closedWon &&
          lead.stage !== PipelineStage.closedLost && (
            <button
              type="button"
              onClick={() => {
                setQuotRefOpen((v) => !v);
                setNoteOpen(false);
              }}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border bg-cyan-900/30 text-cyan-300 border-cyan-700/50 hover:bg-cyan-900/50 transition-colors"
              data-ocid="sales.request_quotation.button"
            >
              <FileText className="w-3 h-3" />
              Request Quotation
              {quotRefOpen ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}

        {/* Add Note */}
        <button
          type="button"
          onClick={() => {
            setNoteOpen((v) => !v);
            setQuotRefOpen(false);
          }}
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border bg-purple-900/30 text-purple-300 border-purple-700/50 hover:bg-purple-900/50 transition-colors"
          data-ocid="sales.add_note.button"
        >
          <ClipboardPen className="w-3 h-3" />
          Add Note
          {noteOpen ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Add Note inline */}
      {noteOpen && (
        <div className="flex flex-col gap-1.5 pt-1">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type your note..."
            rows={2}
            className="bg-muted border-border text-foreground text-xs resize-none"
            data-ocid="sales.note_input"
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs bg-gold text-[#0A1220] hover:bg-gold/90 font-semibold"
              onClick={handleSaveNote}
              disabled={addRemark.isPending || !noteText.trim()}
              data-ocid="sales.note_save.button"
            >
              {addRemark.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : null}
              Save Note
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => {
                setNoteOpen(false);
                setNoteText("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Manual Request Quotation inline (from button in action bar) */}
      {quotRefOpen && quotPrompt === "idle" && (
        <div className="flex flex-col gap-1.5 pt-1">
          <input
            type="text"
            value={quotRef}
            onChange={(e) => setQuotRef(e.target.value)}
            placeholder="Enter Quotation Ref ID"
            className="bg-muted border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-gold/50"
            data-ocid="sales.quotation_ref_input"
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs bg-cyan-700 text-white hover:bg-cyan-600 font-semibold"
              onClick={handleRequestQuotation}
              disabled={requestQuotation.isPending || !quotRef.trim()}
              data-ocid="sales.quotation_submit.button"
            >
              {requestQuotation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : null}
              Submit Request
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => {
                setQuotRefOpen(false);
                setQuotRef("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sales Dashboard View ─────────────────────────────────────────────────────

function SalesDashboard() {
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const navigate = useNavigate();
  const { userId, userRole } = useAuth();
  const { data: myLeads = [], isLoading } = useMyLeads();
  const { data: districts = [] } = useAllDistricts();
  const { data: users = [] } = useAllUsers();
  const { data: pendingRequests = [] } = useGetPendingQuotationRequests();
  const { data: salesLeadToggle = false } = useGetSalesLeadGenerationToggle();
  const updateLead = useUpdateLead();
  const addLead = useAddLead();
  const salesUsers = users.filter((u) => u.role === UserRole.sales);

  // Build set of lead IDs that have pending requests (so card knows)
  const pendingRequestLeadIds = new Set(
    pendingRequests
      .filter((r) => r.status === QuotationRequestStatus.pending)
      .map((r) => r.leadId.toString()),
  );

  const leadsByStage: Record<PipelineStage, Lead[]> = {
    [PipelineStage.inquiry]: [],
    [PipelineStage.surveyScheduled]: [],
    [PipelineStage.quotationSent]: [],
    [PipelineStage.bookingConfirmed]: [],
    [PipelineStage.installation]: [],
    [PipelineStage.closedWon]: [],
    [PipelineStage.closedLost]: [],
  };
  for (const l of myLeads) {
    leadsByStage[l.stage]?.push(l);
  }

  const activeStages = PIPELINE_STAGES.filter(
    (s) => leadsByStage[s].length > 0,
  );

  return (
    <Layout
      onScheduleSurvey={() => navigate({ to: "/pipeline" })}
      showRightPanel={false}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
              My Assigned Leads
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Leads assigned to you — Shree Adishakti Solar Pvt Ltd
            </p>
          </div>
          {salesLeadToggle && (
            <Button
              className="bg-gold text-[#0A1220] hover:bg-gold/90 font-semibold flex-shrink-0"
              onClick={() => setAddLeadOpen(true)}
              data-ocid="sales.create_lead.button"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Lead
            </Button>
          )}
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PIPELINE_STAGES.map((stage) => {
          const count = leadsByStage[stage].length;
          if (count === 0) return null;
          const colors = STAGE_COLORS[stage];
          return (
            <div
              key={stage}
              className={cn(
                "px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5",
                colors.bg,
                colors.text,
                colors.border,
              )}
            >
              {STAGE_LABELS[stage]}
              <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-[10px]">
                {count}
              </span>
            </div>
          );
        })}
        {myLeads.length === 0 && !isLoading && (
          <span className="text-xs text-muted-foreground">No stages yet</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3" data-ocid="sales.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : myLeads.length === 0 ? (
        <div
          className="bg-card border border-border rounded-lg p-12 text-center"
          data-ocid="sales.empty_state"
        >
          <Zap className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-base font-semibold text-muted-foreground">
            No leads assigned yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {salesLeadToggle
              ? "Create your first lead using the button above, or wait for your manager to assign one."
              : "Your manager will assign leads to you soon."}
          </p>
          {salesLeadToggle && (
            <Button
              size="sm"
              className="mt-3 bg-gold text-[#0A1220] hover:bg-gold/90"
              onClick={() => setAddLeadOpen(true)}
              data-ocid="sales.empty_create_lead.button"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Create Lead
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {activeStages.map((stage) => (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                    STAGE_COLORS[stage].bg,
                    STAGE_COLORS[stage].text,
                    STAGE_COLORS[stage].border,
                  )}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {leadsByStage[stage].length} lead
                  {leadsByStage[stage].length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {leadsByStage[stage].map((lead) => (
                  <SalesLeadCard
                    key={lead.id.toString()}
                    lead={lead}
                    onView={setEditLead}
                    pendingRequestLeadIds={pendingRequestLeadIds}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View/Edit existing lead */}
      <LeadModal
        open={!!editLead}
        onClose={() => setEditLead(null)}
        editLead={editLead}
        districts={districts}
        salesUsers={salesUsers}
        currentUserId={userId ?? ""}
        currentUserRole={userRole ?? undefined}
        onSubmit={async (params) => {
          if (editLead) {
            await updateLead.mutateAsync({ leadId: editLead.id, ...params });
          }
        }}
      />

      {/* Create new lead — sales self-assign */}
      <LeadModal
        open={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
        editLead={null}
        districts={districts}
        salesUsers={salesUsers}
        currentUserId={userId ?? ""}
        currentUserRole={userRole ?? undefined}
        isSalesSelfCreate
        onSubmit={async (params) => {
          await addLead.mutateAsync(params);
        }}
      />
    </Layout>
  );
}

// ── Admin / Backoffice Dashboard ──────────────────────────────────────────────

export default function Dashboard() {
  const { userRole } = useAuth();

  // Sales role gets a dedicated assigned-leads view
  if (userRole === UserRole.sales) {
    return <SalesDashboard />;
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [stageLead, setStageLead] = useState<Lead | null>(null);
  const navigate = useNavigate();
  const { userId } = useAuth();

  const { data: allLeads = [], isLoading: leadsLoading } = useAllLeads();
  const { data: totalCount, isLoading: totalLoading } = useTotalLeadsCount();
  const { data: todayCount, isLoading: todayLoading } = useLeadsAddedToday();
  const { data: districts = [] } = useAllDistricts();
  const { data: users = [] } = useAllUsers();

  const addLead = useAddLead();
  const updateLead = useUpdateLead();
  const updateStage = useUpdateLeadStage();

  const salesUsers = users.filter((u) => u.role === UserRole.sales);

  const filteredLeads = selectedDistrict
    ? allLeads.filter((l) => l.district === selectedDistrict)
    : allLeads;

  const pendingSurvey = allLeads.filter(
    (l) => l.stage === PipelineStage.surveyScheduled,
  ).length;
  const installations = allLeads.filter(
    (l) => l.stage === PipelineStage.installation,
  ).length;

  const leadsByStage: Record<PipelineStage, Lead[]> = {
    [PipelineStage.inquiry]: [],
    [PipelineStage.surveyScheduled]: [],
    [PipelineStage.quotationSent]: [],
    [PipelineStage.bookingConfirmed]: [],
    [PipelineStage.installation]: [],
    [PipelineStage.closedWon]: [],
    [PipelineStage.closedLost]: [],
  };
  for (const l of filteredLeads) {
    leadsByStage[l.stage]?.push(l);
  }

  const recentLeads = [...filteredLeads]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 10);

  return (
    <Layout
      selectedDistrict={selectedDistrict}
      onDistrictChange={setSelectedDistrict}
      onAddLead={() => setAddLeadOpen(true)}
      onScheduleSurvey={() => navigate({ to: "/pipeline" })}
      onAssignLeads={() => navigate({ to: "/assignments" })}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
          Solar Sales CRM Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome to Shree Adishakti Solar Pvt Ltd CRM — Odisha Operations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPICard
          title="Total Leads"
          value={totalLoading ? "..." : String(totalCount ?? 0)}
          icon={<Users className="w-4 h-4" />}
          loading={totalLoading}
          accent
        />
        <KPICard
          title="New Leads Today"
          value={todayLoading ? "..." : String(todayCount ?? 0)}
          icon={<TrendingUp className="w-4 h-4" />}
          loading={todayLoading}
        />
        <KPICard
          title="Pending Survey"
          value={leadsLoading ? "..." : String(pendingSurvey)}
          icon={<Activity className="w-4 h-4" />}
          loading={leadsLoading}
        />
        <KPICard
          title="Installations"
          value={leadsLoading ? "..." : String(installations)}
          icon={<Zap className="w-4 h-4" />}
          loading={leadsLoading}
          accent
        />
      </div>

      {/* Pending Quotation Requests Panel (backoffice/admin only) */}
      <PendingQuotationPanel allLeads={allLeads} allUsers={users} />

      {/* Pipeline Board */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Pipeline Tracking
          </h2>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-border text-muted-foreground"
            onClick={() => navigate({ to: "/pipeline" })}
            data-ocid="dashboard.pipeline_view.button"
          >
            Full View
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {PIPELINE_STAGES.slice(0, 4).map((stage) => {
            const stageLeads = leadsByStage[stage];
            return (
              <div
                key={stage}
                className="bg-card border border-border rounded-lg p-3 min-w-[180px] w-[180px] flex-shrink-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground font-semibold">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {stageLeads.slice(0, 3).map((lead, i) => (
                    <LeadCard
                      key={lead.id.toString()}
                      lead={lead}
                      onUpdate={(l) => setStageLead(l)}
                      onView={(l) => setEditLead(l)}
                      index={i + 1}
                    />
                  ))}
                  {stageLeads.length === 0 && (
                    <p
                      className="text-[10px] text-muted-foreground text-center py-2"
                      data-ocid="pipeline.empty_state"
                    >
                      No leads
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Leads Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Recent Leads & Activities
          </h2>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-border text-muted-foreground"
            onClick={() => navigate({ to: "/leads" })}
            data-ocid="dashboard.all_leads.button"
          >
            View All
          </Button>
        </div>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {leadsLoading ? (
            <div
              className="p-4 flex flex-col gap-2"
              data-ocid="leads.loading_state"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <div
              className="p-8 text-center text-muted-foreground"
              data-ocid="leads.empty_state"
            >
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                No leads yet. Add your first customer lead!
              </p>
              <Button
                size="sm"
                className="mt-3 bg-gold text-[#0A1220] hover:bg-gold/90"
                onClick={() => setAddLeadOpen(true)}
                data-ocid="leads.add_first.button"
              >
                Add Lead
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      "Lead Name",
                      "District",
                      "Stage",
                      "Date Added",
                      "Value",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead, i) => (
                    <tr
                      key={lead.id.toString()}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      data-ocid={`leads.row.${i + 1}`}
                    >
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        {lead.customerName}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {lead.district}
                      </td>
                      <td className="px-4 py-2.5">
                        <StageBadge stage={lead.stage} />
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-gold font-semibold">
                        {formatCurrency(lead.requirements.estimatedValue)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-gold"
                            onClick={() => setStageLead(lead)}
                            data-ocid={`leads.edit_button.${i + 1}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditLead(lead)}
                            data-ocid={`leads.secondary_button.${i + 1}`}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-8 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
          <div>
            <p className="font-semibold text-foreground mb-1">Company Info</p>
            <p>Shree Adishakti Solar Pvt Ltd</p>
            <p>Odisha, India</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Quick Links</p>
            <button
              type="button"
              className="block hover:text-gold"
              onClick={() => navigate({ to: "/leads" })}
            >
              Manage Leads
            </button>
            <button
              type="button"
              className="block hover:text-gold"
              onClick={() => navigate({ to: "/pipeline" })}
            >
              Pipeline Board
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} Shree Adishakti Solar Pvt Ltd. All rights
          reserved.
        </p>
      </footer>

      <LeadModal
        open={addLeadOpen || !!editLead}
        onClose={() => {
          setAddLeadOpen(false);
          setEditLead(null);
        }}
        editLead={editLead}
        districts={districts}
        salesUsers={salesUsers}
        currentUserId={userId ?? ""}
        onSubmit={async (params) => {
          if (editLead) {
            await updateLead.mutateAsync({ leadId: editLead.id, ...params });
          } else {
            await addLead.mutateAsync(params);
          }
        }}
      />
      <StageModal
        open={!!stageLead}
        onClose={() => setStageLead(null)}
        lead={stageLead}
        onUpdateStage={async (id, stage, notes) => {
          await updateStage.mutateAsync({ id, stage, notes });
        }}
      />
    </Layout>
  );
}
