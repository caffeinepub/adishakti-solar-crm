import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lead, Remark, UserProfile } from "../backend";
import { PipelineStage, UserRole } from "../backend";
import { useAddRemark, useQuotationsByLead } from "../hooks/useQueries";
import {
  DEFAULT_DISTRICTS,
  QUOTATION_STATUS_COLORS,
  QUOTATION_STATUS_LABELS,
  canAssignLeads,
  formatDate,
  formatDateTime,
} from "../types";
import type { Quotation } from "../types";
import { QuotationModal } from "./QuotationModal";
import { QuotationView } from "./QuotationView";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  editLead?: Lead | null;
  districts: string[];
  salesUsers: UserProfile[];
  currentUserId: string;
  currentUserRole?: UserRole;
  /** When true: sales staff is creating their own lead — assignee locked to self */
  isSalesSelfCreate?: boolean;
  onDelete?: (lead: Lead) => void;
  onSubmit: (params: {
    customerName: string;
    phone: string;
    email: string;
    address: string;
    district: string;
    requirements: {
      panelSize: string;
      systemType: string;
      estimatedValue: bigint;
      notes: string;
    };
    notes: string;
    assignedSalesPerson?: string | null;
  }) => Promise<void>;
}

type ActiveTab = "details" | "remarks" | "quotations";

export function LeadModal({
  open,
  onClose,
  editLead,
  districts,
  salesUsers,
  currentUserId,
  onSubmit,
  currentUserRole,
  isSalesSelfCreate = false,
  onDelete,
}: LeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("details");
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(
    null,
  );
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(
    null,
  );

  const addRemark = useAddRemark();
  const allDistricts = districts.length > 0 ? districts : DEFAULT_DISTRICTS;

  const leadIdStr = editLead ? String(editLead.id) : "";
  const { data: quotations = [] } = useQuotationsByLead(leadIdStr);

  const canManageQuotations =
    currentUserRole === UserRole.admin ||
    currentUserRole === UserRole.backoffice;

  // When a sales staff member creates their own lead, find their display name
  const selfUserName = isSalesSelfCreate
    ? (salesUsers.find((u) => u.userId === currentUserId)?.name ??
      currentUserId)
    : null;

  const [form, setFormState] = useState({
    customerName: editLead?.customerName ?? "",
    phone: editLead?.phone ?? "",
    email: editLead?.email ?? "",
    address: editLead?.address ?? "",
    district: editLead?.district ?? "",
    panelSize: editLead?.requirements?.panelSize ?? "",
    systemType: editLead?.requirements?.systemType ?? "",
    estimatedValue: editLead?.requirements?.estimatedValue
      ? String(editLead.requirements.estimatedValue)
      : "",
    reqNotes: editLead?.requirements?.notes ?? "",
    notes: editLead?.notes ?? "",
    assignedSalesPerson: editLead?.assignedSalesPerson ?? "",
  });

  const set = (field: string, value: string) =>
    setFormState((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.phone || !form.district) {
      toast.error("Customer Name, Phone, and District are required.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        customerName: form.customerName,
        phone: form.phone,
        email: form.email,
        address: form.address,
        district: form.district,
        requirements: {
          panelSize: form.panelSize,
          systemType: form.systemType,
          estimatedValue: BigInt(
            Math.max(0, Number.parseInt(form.estimatedValue || "0", 10)),
          ),
          notes: form.reqNotes,
        },
        notes: form.notes,
        assignedSalesPerson: form.assignedSalesPerson || null,
      });
      toast.success(editLead ? "Lead updated!" : "Lead added!");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save lead.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemark = async () => {
    if (!remarkText.trim() || !editLead) return;
    try {
      await addRemark.mutateAsync({
        leadId: editLead.id,
        content: remarkText.trim(),
      });
      setRemarkText("");
      toast.success("Remark added!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add remark.";
      toast.error(msg);
    }
  };

  const sortedRemarks: Remark[] = editLead?.remarks
    ? [...editLead.remarks].sort((a, b) => Number(b.addedAt - a.addedAt))
    : [];

  const tabs: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      id: "details",
      label: "Details",
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: "remarks",
      label: "Remarks",
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      count: sortedRemarks.length,
    },
    ...(editLead
      ? [
          {
            id: "quotations" as ActiveTab,
            label: "Quotations",
            icon: <FileText className="w-3.5 h-3.5" />,
            count: quotations.length,
          },
        ]
      : []),
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className="max-w-2xl bg-card border-border text-foreground max-h-[92vh] overflow-y-auto"
          data-ocid="lead.dialog"
        >
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-gold font-bold">
                {editLead ? "Edit Lead" : "Add New Customer Lead"}
              </DialogTitle>
              {editLead && onDelete && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                  onClick={() => {
                    onClose();
                    onDelete(editLead);
                  }}
                  aria-label="Delete lead"
                  data-ocid="lead.delete_button"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Tabs (only for existing leads) */}
          {editLead && (
            <div className="flex gap-1 border-b border-border pb-0 -mb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-gold text-gold"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                  data-ocid={`lead.tab.${tab.id}`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-muted text-muted-foreground rounded-full text-[10px] px-1.5 py-0.5 font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── DETAILS TAB ─────────────────────────────────────────────── */}
          {activeTab === "details" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                    Customer Name *
                  </Label>
                  <Input
                    value={form.customerName}
                    onChange={(e) => set("customerName", e.target.value)}
                    placeholder="Full name"
                    className="bg-muted border-border text-foreground"
                    data-ocid="lead.input"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                    Phone *
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                    Email
                  </Label>
                  <Input
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="email@example.com"
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                    Address
                  </Label>
                  <Input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Full address"
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                    District *
                  </Label>
                  <Select
                    value={form.district}
                    onValueChange={(v) => set("district", v)}
                  >
                    <SelectTrigger
                      className="bg-muted border-border text-foreground"
                      data-ocid="lead.select"
                    >
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border max-h-60 overflow-y-auto">
                      {allDistricts.map((d) => (
                        <SelectItem
                          key={d}
                          value={d}
                          className="text-foreground hover:bg-muted"
                        >
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Admin/Backoffice: assign to a salesperson */}
              {currentUserRole &&
                canAssignLeads(currentUserRole) &&
                !isSalesSelfCreate && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                      Assign To Salesperson
                    </Label>
                    <Select
                      value={form.assignedSalesPerson || "__unassigned__"}
                      onValueChange={(v) =>
                        set(
                          "assignedSalesPerson",
                          v === "__unassigned__" ? "" : v,
                        )
                      }
                    >
                      <SelectTrigger
                        className="bg-muted border-border text-foreground"
                        data-ocid="lead.assign_salesperson.select"
                      >
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border max-h-60 overflow-y-auto">
                        <SelectItem
                          value="__unassigned__"
                          className="text-muted-foreground"
                        >
                          — Unassigned —
                        </SelectItem>
                        {salesUsers.map((u) => (
                          <SelectItem
                            key={u.userId}
                            value={u.userId}
                            className="text-foreground hover:bg-muted"
                          >
                            {u.name}{" "}
                            <span className="text-xs text-muted-foreground font-mono">
                              ({u.userId})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

              {/* Sales self-create: show locked "Assigned To" field */}
              {isSalesSelfCreate && selfUserName && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-950/30 border border-emerald-700/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">
                      Assigned To (You)
                    </p>
                    <p className="text-sm font-semibold text-emerald-300">
                      {selfUserName}{" "}
                      <span className="text-[11px] font-mono text-muted-foreground">
                        ({currentUserId})
                      </span>
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-400/70 font-semibold bg-emerald-900/30 border border-emerald-700/40 px-2 py-0.5 rounded">
                    Auto-assigned
                  </span>
                </div>
              )}

              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-gold uppercase mb-2">
                  Solar Requirements
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                      Panel Size (kW)
                    </Label>
                    <Input
                      value={form.panelSize}
                      onChange={(e) => set("panelSize", e.target.value)}
                      placeholder="e.g. 5 kW"
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                      System Type
                    </Label>
                    <Input
                      value={form.systemType}
                      onChange={(e) => set("systemType", e.target.value)}
                      placeholder="On-grid / Off-grid"
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                      Estimated Value (₹)
                    </Label>
                    <Input
                      value={form.estimatedValue}
                      onChange={(e) => set("estimatedValue", e.target.value)}
                      placeholder="e.g. 250000"
                      type="number"
                      min="0"
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                      Requirements Notes
                    </Label>
                    <Textarea
                      value={form.reqNotes}
                      onChange={(e) => set("reqNotes", e.target.value)}
                      placeholder="Special requirements..."
                      rows={2}
                      className="bg-muted border-border text-foreground resize-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  General Notes
                </Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                  className="bg-muted border-border text-foreground resize-none"
                  data-ocid="lead.textarea"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-border text-muted-foreground"
                  data-ocid="lead.cancel_button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gold text-[#0A1220] hover:bg-gold/90 font-semibold"
                  data-ocid="lead.submit_button"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editLead ? "Update Lead" : "Add Lead"}
                </Button>
              </div>
            </form>
          )}

          {/* ── REMARKS TAB ─────────────────────────────────────────────── */}
          {activeTab === "remarks" && editLead && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-2">
                <Input
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="Add a remark..."
                  className="bg-muted border-border text-foreground text-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleAddRemark()}
                  data-ocid="remark.input"
                />
                <Button
                  size="sm"
                  className="bg-gold text-[#0A1220] hover:bg-gold/90 font-semibold flex-shrink-0"
                  onClick={handleAddRemark}
                  disabled={addRemark.isPending || !remarkText.trim()}
                  data-ocid="remark.submit_button"
                >
                  {addRemark.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
              {sortedRemarks.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground text-center py-8"
                  data-ocid="remarks.empty_state"
                >
                  No remarks yet. Add the first remark above.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {sortedRemarks.map((remark, i) => (
                    <div
                      key={`${remark.addedAt.toString()}-${i}`}
                      className="bg-muted/50 rounded-lg p-2.5 border border-border/50"
                      data-ocid={`remark.item.${i + 1}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gold">
                          {remark.addedBy}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatDateTime(remark.addedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">
                        {remark.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── QUOTATIONS TAB ──────────────────────────────────────────── */}
          {activeTab === "quotations" && editLead && (
            <div className="flex flex-col gap-3 pt-2">
              {canManageQuotations && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="bg-gold text-[#0A1220] hover:bg-gold/90 font-semibold gap-1"
                    onClick={() => {
                      setEditingQuotation(null);
                      setShowQuotationModal(true);
                    }}
                    data-ocid="quotation.create_button"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Quotation
                  </Button>
                </div>
              )}
              {quotations.length === 0 ? (
                <div
                  className="text-center py-10"
                  data-ocid="quotations.empty_state"
                >
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">
                    No quotations yet.
                    {canManageQuotations && " Create one above."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {quotations.map((q) => {
                    const sc = QUOTATION_STATUS_COLORS[q.status];
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setViewingQuotation(q)}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors text-left w-full"
                        data-ocid={`quotation.item.${q.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground font-mono">
                              #{q.quotationNumber}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded border font-semibold",
                                sc.bg,
                                sc.text,
                                sc.border,
                              )}
                            >
                              {QUOTATION_STATUS_LABELS[q.status]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(q.createdAt)} · {q.systemType} ·{" "}
                            {q.panelCapacity} kW
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gold">
                            ₹
                            {q.totalAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 0,
                            })}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Total
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quotation create/edit modal */}
      {showQuotationModal && editLead && (
        <QuotationModal
          leadId={String(editLead.id)}
          customerName={editLead.customerName}
          customerAddress={editLead.address}
          editQuotation={editingQuotation}
          onClose={() => {
            setShowQuotationModal(false);
            setEditingQuotation(null);
          }}
        />
      )}

      {/* Quotation view modal */}
      {viewingQuotation && (
        <QuotationView
          quotation={viewingQuotation}
          onClose={() => setViewingQuotation(null)}
          onEdit={
            canManageQuotations
              ? () => {
                  setEditingQuotation(viewingQuotation);
                  setViewingQuotation(null);
                  setShowQuotationModal(true);
                }
              : undefined
          }
        />
      )}
    </>
  );
}
