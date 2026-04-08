import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Lead } from "../backend";
import { UserRole } from "../backend";
import { Layout } from "../components/Layout";
import { LeadCard } from "../components/LeadCard";
import { LeadModal } from "../components/LeadModal";
import { StageModal } from "../components/StageModal";
import { useAuth } from "../hooks/useAuth";
import {
  useAddLead,
  useAllDistricts,
  useAllLeads,
  useAllUsers,
  useUpdateLead,
  useUpdateLeadStage,
} from "../hooks/useQueries";
import {
  PIPELINE_STAGES,
  PipelineStage,
  STAGE_COLORS,
  STAGE_LABELS,
} from "../types";

export default function Pipeline() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [stageLead, setStageLead] = useState<Lead | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const { userId } = useAuth();

  const { data: allLeads = [] } = useAllLeads();
  const { data: districts = [] } = useAllDistricts();
  const { data: users = [] } = useAllUsers();
  const addLead = useAddLead();
  const updateLead = useUpdateLead();
  const updateStage = useUpdateLeadStage();

  const salesUsers = users.filter((u) => u.role === UserRole.sales);

  const filteredLeads = selectedDistrict
    ? allLeads.filter((l) => l.district === selectedDistrict)
    : allLeads;

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

  return (
    <Layout
      selectedDistrict={selectedDistrict}
      onDistrictChange={setSelectedDistrict}
      onAddLead={() => setAddLeadOpen(true)}
      showRightPanel={false}
    >
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
          Pipeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full kanban pipeline — {filteredLeads.length} total leads
          {selectedDistrict ? ` in ${selectedDistrict}` : ""}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leadsByStage[stage];
          const colors = STAGE_COLORS[stage];
          return (
            <div
              key={stage}
              className="flex-shrink-0 w-64 flex flex-col"
              data-ocid={`pipeline.${stage}.panel`}
            >
              <div
                className={cn(
                  "flex items-center justify-between mb-2 px-3 py-2 rounded-t-lg border",
                  colors.bg,
                  colors.border,
                )}
              >
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    colors.text,
                  )}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span
                  className={cn(
                    "text-xs font-bold px-1.5 py-0.5 rounded-full bg-black/20",
                    colors.text,
                  )}
                >
                  {stageLeads.length}
                </span>
              </div>
              <div className="bg-card border border-t-0 border-border rounded-b-lg flex flex-col gap-2 p-2 flex-1 min-h-[200px]">
                {stageLeads.length === 0 ? (
                  <div
                    className="flex-1 flex items-center justify-center py-6"
                    data-ocid={`pipeline.${stage}.empty_state`}
                  >
                    <p className="text-[11px] text-muted-foreground">
                      No leads in this stage
                    </p>
                  </div>
                ) : (
                  stageLeads.map((lead, i) => (
                    <LeadCard
                      key={lead.id.toString()}
                      lead={lead}
                      onUpdate={(l) => setStageLead(l)}
                      onView={(l) => setEditLead(l)}
                      index={i + 1}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

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
