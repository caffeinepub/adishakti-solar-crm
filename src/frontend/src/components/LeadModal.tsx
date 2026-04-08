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
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Lead, Remark, UserProfile } from "../backend";
import { PipelineStage } from "../backend";
import { useAddRemark } from "../hooks/useQueries";
import { DEFAULT_DISTRICTS, formatDateTime } from "../types";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  editLead?: Lead | null;
  districts: string[];
  salesUsers: UserProfile[];
  currentUserId: string;
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
  }) => Promise<void>;
}

export function LeadModal({
  open,
  onClose,
  editLead,
  districts,
  onSubmit,
}: LeadModalProps) {
  const [loading, setLoading] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const addRemark = useAddRemark();
  const allDistricts = districts.length > 0 ? districts : DEFAULT_DISTRICTS;

  const [form, setFormState] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    district: "",
    panelSize: "",
    systemType: "",
    estimatedValue: "",
    reqNotes: "",
    notes: "",
    assignedSalesPerson: "",
  });

  // Reset form when lead changes
  useEffect(() => {
    setFormState({
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
  }, [editLead]);

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

  // Sort remarks newest-first
  const sortedRemarks: Remark[] = editLead?.remarks
    ? [...editLead.remarks].sort((a, b) => Number(b.addedAt - a.addedAt))
    : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl bg-card border-border text-foreground max-h-[90vh] overflow-y-auto"
        data-ocid="lead.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-gold font-bold">
            {editLead ? "Edit Lead" : "Add New Customer Lead"}
          </DialogTitle>
        </DialogHeader>
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
                <SelectContent className="bg-popover border-border">
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

        {/* Remarks section — only for existing leads */}
        {editLead && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-gold" />
              <p className="text-xs font-bold text-gold uppercase tracking-widest">
                Remarks Log
              </p>
              <span className="ml-auto text-xs text-muted-foreground">
                {sortedRemarks.length} remarks
              </span>
            </div>
            {/* Add remark */}
            <div className="flex gap-2 mb-3">
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
            {/* Remarks list */}
            {sortedRemarks.length === 0 ? (
              <p
                className="text-xs text-muted-foreground text-center py-3"
                data-ocid="remarks.empty_state"
              >
                No remarks yet. Add the first remark above.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
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
      </DialogContent>
    </Dialog>
  );
}
