import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { Activity, Edit2, Eye, TrendingUp, Users, Zap } from "lucide-react";
import { useState } from "react";
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
  useAllDistricts,
  useAllLeads,
  useAllUsers,
  useLeadsAddedToday,
  useTotalLeadsCount,
  useUpdateLead,
  useUpdateLeadStage,
} from "../hooks/useQueries";
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  formatCurrency,
  formatDate,
} from "../types";

export default function Dashboard() {
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
