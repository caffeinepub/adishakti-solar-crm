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
  Edit2,
  Eye,
  FileText,
  Loader2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lead } from "../backend";
import { PipelineStage, UserRole } from "../backend";
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
  useLeadsAddedToday,
  useMyLeads,
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
} from "../types";

// ── Sales Lead Card with quick actions ───────────────────────────────────────

interface SalesLeadCardProps {
  lead: Lead;
  onView: (lead: Lead) => void;
}

function SalesLeadCard({ lead, onView }: SalesLeadCardProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [quotRefOpen, setQuotRefOpen] = useState(false);
  const [quotRef, setQuotRef] = useState("");

  const updateStage = useUpdateLeadStage();
  const addRemark = useAddRemark();

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
    } catch {
      toast.error("Failed to update stage.");
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
    const msg = `Quotation requested - Ref: ${quotRef.trim()}`;
    try {
      await updateStage.mutateAsync({
        id: lead.id,
        stage: PipelineStage.quotationSent,
        notes: msg,
      });
      await addRemark.mutateAsync({ leadId: lead.id, content: msg });
      setQuotRef("");
      setQuotRefOpen(false);
      toast.success("Quotation request submitted!");
    } catch {
      toast.error("Failed to request quotation.");
    }
  };

  const isBusy = updateStage.isPending || addRemark.isPending;

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

      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
        {/* Survey Done */}
        {canMarkSurvey && (
          <button
            type="button"
            disabled={isSurveyDone || isBusy}
            onClick={handleSurveyDone}
            className={cn(
              "flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border transition-colors",
              isSurveyDone
                ? "bg-amber-900/20 text-amber-400 border-amber-700/40 cursor-default opacity-70"
                : "bg-amber-900/30 text-amber-300 border-amber-700/50 hover:bg-amber-900/50",
            )}
            data-ocid="sales.survey_done.button"
          >
            {isBusy && !isSurveyDone ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            {isSurveyDone ? "Survey Completed" : "Survey Done"}
          </button>
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

        {/* Request Quotation */}
        {lead.stage !== PipelineStage.quotationSent &&
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

      {/* Request Quotation inline */}
      {quotRefOpen && (
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
              disabled={updateStage.isPending || !quotRef.trim()}
              data-ocid="sales.quotation_submit.button"
            >
              {updateStage.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : null}
              Submit
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
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { data: myLeads = [], isLoading } = useMyLeads();
  const { data: districts = [] } = useAllDistricts();
  const { data: users = [] } = useAllUsers();
  const updateLead = useUpdateLead();
  const salesUsers = users.filter((u) => u.role === UserRole.sales);

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
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
          My Assigned Leads
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Leads assigned to you — Shree Adishakti Solar Pvt Ltd
        </p>
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
            Your manager will assign leads to you soon.
          </p>
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
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <LeadModal
        open={!!editLead}
        onClose={() => setEditLead(null)}
        editLead={editLead}
        districts={districts}
        salesUsers={salesUsers}
        currentUserId={userId ?? ""}
        onSubmit={async (params) => {
          if (editLead) {
            await updateLead.mutateAsync({ leadId: editLead.id, ...params });
          }
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
