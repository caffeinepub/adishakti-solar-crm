import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Edit2,
  Eye,
  Filter,
  Search,
  Trash2,
  UserPlus,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Lead } from "../backend";
import { UserRole } from "../backend";
import { Layout } from "../components/Layout";
import { LeadModal } from "../components/LeadModal";
import { StageBadge } from "../components/StageBadge";
import { StageModal } from "../components/StageModal";
import { useAuth } from "../hooks/useAuth";
import {
  useAddLead,
  useAllDistricts,
  useAllLeads,
  useAllUsers,
  useDeleteLead,
  useGetSalesLeadGenerationToggle,
  useMyLeads,
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
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const { userId, userRole } = useAuth();

  const { data: districts = [] } = useAllDistricts();
  const { data: users = [] } = useAllUsers();
  const { data: salesLeadToggle = false } = useGetSalesLeadGenerationToggle();
  const addLead = useAddLead();
  const updateLead = useUpdateLead();
  const updateStage = useUpdateLeadStage();
  const deleteLead = useDeleteLead();

  const isAdmin = userRole === UserRole.admin;
  const isSales = userRole === UserRole.sales;

  const { data: allLeadsData = [], isLoading: allLeadsLoading } = useAllLeads();
  const { data: myLeadsData = [], isLoading: myLeadsLoading } = useMyLeads();
  const allLeads = isSales ? myLeadsData : allLeadsData;
  const isLoading = isSales ? myLeadsLoading : allLeadsLoading;
  const canAddLead =
    userRole === UserRole.admin ||
    userRole === UserRole.backoffice ||
    (isSales && salesLeadToggle);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLead.mutateAsync(deleteTarget.id);
      toast.success(`Lead for ${deleteTarget.customerName} deleted.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete lead.";
      toast.error(msg);
    }
  };

  return (
    <Layout
      selectedDistrict={selectedDistrict}
      onDistrictChange={setSelectedDistrict}
      onAddLead={canAddLead ? () => setAddLeadOpen(true) : undefined}
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
          {canAddLead && (
            <Button
              className="bg-gold text-[#0A1220] hover:bg-gold/90 font-semibold"
              onClick={() => setAddLeadOpen(true)}
              data-ocid="leads.add_lead.button"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Add Lead
            </Button>
          )}
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
        <Select
          value={selectedDistrict ?? "all"}
          onValueChange={(v) => setSelectedDistrict(v === "all" ? null : v)}
        >
          <SelectTrigger
            className="w-44 bg-muted border-border text-foreground h-9"
            data-ocid="leads.district.select"
          >
            <SelectValue placeholder="All Districts" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-60 overflow-y-auto">
            <SelectItem value="all" className="text-foreground">
              All Districts
            </SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d} className="text-foreground">
                {d}
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
            {canAddLead && (
              <Button
                size="sm"
                className="mt-3 bg-gold text-[#0A1220] hover:bg-gold/90"
                onClick={() => setAddLeadOpen(true)}
              >
                Add Lead
              </Button>
            )}
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
                    (u) => u.userId === lead.assignedSalesPerson,
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
                            aria-label="Edit stage"
                            data-ocid={`leads.edit_button.${i + 1}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditLead(lead)}
                            aria-label="View lead"
                            data-ocid={`leads.secondary_button.${i + 1}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget(lead)}
                              aria-label="Delete lead"
                              data-ocid={`leads.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
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
        currentUserId={userId ?? ""}
        currentUserRole={userRole ?? undefined}
        isSalesSelfCreate={!editLead && isSales}
        onDelete={isAdmin ? (lead) => setDeleteTarget(lead) : undefined}
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent
          className="bg-card border-border"
          data-ocid="leads.delete_dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete this lead?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the lead for{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.customerName}
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border text-muted-foreground"
              data-ocid="leads.delete_cancel"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="leads.delete_confirm"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
