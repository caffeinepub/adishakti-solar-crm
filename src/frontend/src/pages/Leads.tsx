import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit2, Eye, Filter, Search, UserPlus, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import type { Lead } from "../backend";
import { PipelineStage, UserRole } from "../backend";
import { Layout } from "../components/Layout";
import { LeadModal } from "../components/LeadModal";
import { StageBadge } from "../components/StageBadge";
import { StageModal } from "../components/StageModal";
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
  STAGE_LABELS,
  formatCurrency,
  formatDate,
} from "../types";

export default function Leads() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [stageLead, setStageLead] = useState<Lead | null>(null);

  const { data: allLeads = [], isLoading } = useAllLeads();
  const { data: districts = [] } = useAllDistricts();
  const { data: users = [] } = useAllUsers();
  const addLead = useAddLead();
  const updateLead = useUpdateLead();
  const updateStage = useUpdateLeadStage();

  const salesUsers = users.filter((u) => u.role === UserRole.sales);

  const filtered = useMemo(() => {
    let leads = allLeads;
    if (selectedDistrict)
      leads = leads.filter((l) => l.district === selectedDistrict);
    if (stageFilter !== "all")
      leads = leads.filter((l) => l.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.district.toLowerCase().includes(q),
      );
    }
    return [...leads].sort((a, b) => Number(b.createdAt - a.createdAt));
  }, [allLeads, selectedDistrict, stageFilter, search]);

  return (
    <Layout
      selectedDistrict={selectedDistrict}
      onDistrictChange={setSelectedDistrict}
      onAddLead={() => setAddLeadOpen(true)}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
              Leads
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
              {selectedDistrict ? ` in ${selectedDistrict}` : ""}
            </p>
          </div>
          <Button
            className="bg-gold text-navy-800 hover:bg-gold-dark font-semibold"
            onClick={() => setAddLeadOpen(true)}
            data-ocid="leads.add_lead.button"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="pl-8 bg-muted border-border text-foreground h-9"
            data-ocid="leads.search_input"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger
            className="w-44 bg-muted border-border text-foreground h-9"
            data-ocid="leads.stage.select"
          >
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-foreground">
              All Stages
            </SelectItem>
            {PIPELINE_STAGES.map((s) => (
              <SelectItem key={s} value={s} className="text-foreground">
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div
            className="p-4 flex flex-col gap-2"
            data-ocid="leads.loading_state"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center" data-ocid="leads.empty_state">
            <Zap className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No leads found.</p>
            <Button
              size="sm"
              className="mt-3 bg-gold text-navy-800 hover:bg-gold-dark"
              onClick={() => setAddLeadOpen(true)}
            >
              Add Lead
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "#",
                    "Customer",
                    "Phone",
                    "District",
                    "Stage",
                    "Value",
                    "Sales Person",
                    "Added",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => {
                  const sp = users.find(
                    (u) =>
                      u.principal.toString() ===
                      lead.assignedSalesPerson?.toString(),
                  );
                  return (
                    <tr
                      key={lead.id.toString()}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      data-ocid={`leads.item.${i + 1}`}
                    >
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground max-w-[140px] truncate">
                        {lead.customerName}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {lead.phone}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {lead.district}
                      </td>
                      <td className="px-3 py-2.5">
                        <StageBadge stage={lead.stage} />
                      </td>
                      <td className="px-3 py-2.5 text-gold font-semibold">
                        {formatCurrency(lead.requirements.estimatedValue)}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {sp?.name ?? <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-gold"
                            onClick={() => setStageLead(lead)}
                            data-ocid={`leads.edit_button.${i + 1}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditLead(lead)}
                            data-ocid={`leads.secondary_button.${i + 1}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
        onSubmit={async (lead) => {
          if (editLead) {
            await updateLead.mutateAsync({ id: editLead.id, lead });
          } else {
            await addLead.mutateAsync(lead);
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
