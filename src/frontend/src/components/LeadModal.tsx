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
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lead, UserProfile } from "../backend";
import { PipelineStage, UserRole } from "../backend";
import type { District } from "../backend";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  editLead?: Lead | null;
  districts: District[];
  salesUsers: UserProfile[];
  onSubmit: (lead: Lead) => Promise<void>;
}

export function LeadModal({
  open,
  onClose,
  editLead,
  districts,
  salesUsers,
  onSubmit,
}: LeadModalProps) {
  const { identity } = useInternetIdentity();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<{
    customerName: string;
    phone: string;
    email: string;
    address: string;
    district: string;
    panelSize: string;
    systemType: string;
    estimatedValue: string;
    reqNotes: string;
    notes: string;
    assignedSalesPerson: string;
  }>(() => ({
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
    assignedSalesPerson: editLead?.assignedSalesPerson?.toString() ?? "",
  }));

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.phone || !form.district) {
      toast.error("Customer Name, Phone, and District are required.");
      return;
    }
    if (!identity) {
      toast.error("Not authenticated.");
      return;
    }

    const now = BigInt(Date.now()) * BigInt(1_000_000);
    const salesPrincipal = salesUsers.find(
      (u) => u.principal.toString() === form.assignedSalesPerson,
    )?.principal;

    const lead: Lead = {
      id: editLead?.id ?? BigInt(0),
      customerName: form.customerName,
      phone: form.phone,
      email: form.email,
      address: form.address,
      district: form.district,
      notes: form.notes,
      stage: editLead?.stage ?? PipelineStage.inquiry,
      requirements: {
        panelSize: form.panelSize,
        systemType: form.systemType,
        estimatedValue: BigInt(
          Math.max(0, Number.parseInt(form.estimatedValue || "0", 10)),
        ),
        notes: form.reqNotes,
      },
      assignedSalesPerson: salesPrincipal,
      assignedOperationsPerson: editLead?.assignedOperationsPerson,
      createdAt: editLead?.createdAt ?? now,
      updatedAt: now,
      createdBy: editLead?.createdBy ?? identity.getPrincipal(),
    };

    setLoading(true);
    try {
      await onSubmit(lead);
      toast.success(editLead ? "Lead updated!" : "Lead added!");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save lead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-xl bg-card border-border text-foreground max-h-[90vh] overflow-y-auto"
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
                  {districts.map((d) => (
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
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                Assign Sales Person
              </Label>
              <Select
                value={form.assignedSalesPerson}
                onValueChange={(v) => set("assignedSalesPerson", v)}
              >
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value="__none__"
                    className="text-muted-foreground"
                  >
                    None
                  </SelectItem>
                  {salesUsers.map((u) => (
                    <SelectItem
                      key={u.principal.toString()}
                      value={u.principal.toString()}
                      className="text-foreground hover:bg-muted"
                    >
                      {u.name} ({u.district})
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

          <div className="flex gap-2 justify-end pt-2">
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
              className="bg-gold text-navy-800 hover:bg-gold-dark font-semibold"
              data-ocid="lead.submit_button"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editLead ? "Update Lead" : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
