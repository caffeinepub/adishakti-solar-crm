import { Button } from "@/components/ui/button";
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
import { Loader2, Plus, Send, Trash2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useCreateQuotation,
  useUpdateQuotation,
  useUpdateQuotationStatus,
} from "../hooks/useQueries";
import type { Quotation, QuotationInput, QuotationItem } from "../types";

const SYSTEM_TYPES = ["On-Grid", "Off-Grid", "Hybrid"] as const;

const STANDARD_ITEMS: QuotationItem[] = [
  {
    itemName: "Solar Panels",
    description: "Polycrystalline/Monocrystalline",
    quantity: 1,
    unitPrice: 0,
  },
  {
    itemName: "Solar Inverter",
    description: "Grid-tied/Off-grid inverter",
    quantity: 1,
    unitPrice: 0,
  },
  {
    itemName: "Mounting Structure",
    description: "GI/Aluminium mounting structure",
    quantity: 1,
    unitPrice: 0,
  },
  {
    itemName: "DC Cable",
    description: "4 sqmm DC solar cable",
    quantity: 1,
    unitPrice: 0,
  },
  {
    itemName: "AC Cable",
    description: "4 sqmm AC cable",
    quantity: 1,
    unitPrice: 0,
  },
  {
    itemName: "Installation Charges",
    description: "Labour and installation",
    quantity: 1,
    unitPrice: 0,
  },
];

interface Props {
  leadId: string;
  customerName: string;
  customerAddress: string;
  editQuotation?: Quotation | null;
  onClose: () => void;
  onSaved?: (q: Quotation) => void;
}

function newItem(): QuotationItem {
  return { itemName: "", description: "", quantity: 1, unitPrice: 0 };
}

export function QuotationModal({
  leadId,
  customerName,
  customerAddress,
  editQuotation,
  onClose,
  onSaved,
}: Props) {
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();
  const updateQuotationStatus = useUpdateQuotationStatus();

  const [form, setForm] = useState<QuotationInput>({
    customerName: editQuotation?.customerName ?? customerName,
    customerAddress: editQuotation?.customerAddress ?? customerAddress,
    systemType: editQuotation?.systemType ?? "On-Grid",
    panelCapacity: editQuotation?.panelCapacity ?? 0,
    items: editQuotation?.items ?? [newItem()],
    gstPercent: editQuotation?.gstPercent ?? 18,
    notes:
      editQuotation?.notes ??
      "Payment: 50% advance, 50% before installation.\nWarranty: 5 years on panels, 2 years on inverter.",
    validityDays: editQuotation?.validityDays ?? 30,
  });

  const [saveAsSent, setSaveAsSent] = useState(false);

  useEffect(() => {
    if (editQuotation) {
      setForm({
        customerName: editQuotation.customerName,
        customerAddress: editQuotation.customerAddress,
        systemType: editQuotation.systemType,
        panelCapacity: editQuotation.panelCapacity,
        items: editQuotation.items,
        gstPercent: editQuotation.gstPercent,
        notes: editQuotation.notes,
        validityDays: editQuotation.validityDays,
      });
    }
  }, [editQuotation]);

  const subtotal = form.items.reduce(
    (acc, it) => acc + it.quantity * it.unitPrice,
    0,
  );
  const gstAmount = (subtotal * form.gstPercent) / 100;
  const totalAmount = subtotal + gstAmount;

  const setField = <K extends keyof QuotationInput>(
    k: K,
    v: QuotationInput[K],
  ) => setForm((p) => ({ ...p, [k]: v }));

  const setItem = (
    idx: number,
    field: keyof QuotationItem,
    value: string | number,
  ) =>
    setForm((p) => {
      const items = p.items.map((it, i) =>
        i === idx ? { ...it, [field]: value } : it,
      );
      return { ...p, items };
    });

  const addItem = () =>
    setForm((p) => ({ ...p, items: [...p.items, newItem()] }));

  const removeItem = (idx: number) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const addStandardItems = () =>
    setForm((p) => ({ ...p, items: [...STANDARD_ITEMS] }));

  const handleSave = async (asSent: boolean) => {
    if (!form.customerName.trim()) {
      toast.error("Customer name is required.");
      return;
    }
    setSaveAsSent(asSent);
    try {
      let saved: Quotation;
      if (editQuotation) {
        saved = await updateQuotation.mutateAsync({
          id: editQuotation.id,
          leadId,
          input: form,
        });
      } else {
        saved = await createQuotation.mutateAsync({ leadId, input: form });
      }
      if (asSent) {
        await updateQuotationStatus.mutateAsync({
          id: saved.id,
          leadId,
          status: "sent",
        });
        toast.success("Quotation sent to customer!");
      } else {
        toast.success(
          editQuotation ? "Quotation updated!" : "Quotation created!",
        );
      }
      onSaved?.(saved);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save quotation.";
      toast.error(msg);
    }
  };

  const isPending =
    createQuotation.isPending ||
    updateQuotation.isPending ||
    updateQuotationStatus.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-4"
      data-ocid="quotation.modal"
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl mx-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-gold tracking-tight">
              {editQuotation ? "Edit Quotation" : "Create Project Quotation"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shree Adishakti Solar Pvt Ltd
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                Customer Name *
              </Label>
              <Input
                value={form.customerName}
                onChange={(e) => setField("customerName", e.target.value)}
                className="bg-muted border-border text-foreground"
                data-ocid="quotation.customer_name.input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                Customer Address
              </Label>
              <Input
                value={form.customerAddress}
                onChange={(e) => setField("customerAddress", e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                System Type
              </Label>
              <Select
                value={form.systemType}
                onValueChange={(v) => setField("systemType", v)}
              >
                <SelectTrigger
                  className="bg-muted border-border text-foreground"
                  data-ocid="quotation.system_type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {SYSTEM_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-foreground">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                Panel Capacity (kW)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={form.panelCapacity}
                onChange={(e) =>
                  setField(
                    "panelCapacity",
                    Number.parseFloat(e.target.value) || 0,
                  )
                }
                className="bg-muted border-border text-foreground"
                data-ocid="quotation.panel_capacity.input"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gold uppercase tracking-widest">
                Line Items
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-gold/40 text-gold hover:bg-gold/10 gap-1"
                onClick={addStandardItems}
                data-ocid="quotation.standard_items_button"
              >
                <Zap className="w-3 h-3" />
                Add Standard Items
              </Button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold w-[30%]">
                      Item
                    </th>
                    <th className="text-left px-2 py-2 text-muted-foreground font-semibold">
                      Description
                    </th>
                    <th className="text-right px-2 py-2 text-muted-foreground font-semibold w-16">
                      Qty
                    </th>
                    <th className="text-right px-2 py-2 text-muted-foreground font-semibold w-24">
                      Unit Price ₹
                    </th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-semibold w-24">
                      Total ₹
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr
                      key={`item-${item.itemName}-${idx}`}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-3 py-1.5">
                        <Input
                          value={item.itemName}
                          onChange={(e) =>
                            setItem(idx, "itemName", e.target.value)
                          }
                          placeholder="Item name"
                          className="bg-transparent border-border/40 text-foreground h-7 text-xs px-2"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            setItem(idx, "description", e.target.value)
                          }
                          placeholder="Optional"
                          className="bg-transparent border-border/40 text-foreground h-7 text-xs px-2"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            setItem(
                              idx,
                              "quantity",
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          className="bg-transparent border-border/40 text-foreground h-7 text-xs px-2 text-right"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            setItem(
                              idx,
                              "unitPrice",
                              Number.parseFloat(e.target.value) || 0,
                            )
                          }
                          className="bg-transparent border-border/40 text-foreground h-7 text-xs px-2 text-right"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right font-semibold text-foreground">
                        ₹
                        {(item.quantity * item.unitPrice).toLocaleString(
                          "en-IN",
                        )}
                      </td>
                      <td className="px-1 py-1.5">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          aria-label="Remove item"
                          disabled={form.items.length === 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 h-7 text-xs text-gold hover:bg-gold/10 gap-1"
              onClick={addItem}
              data-ocid="quotation.add_item_button"
            >
              <Plus className="w-3 h-3" />
              Add Row
            </Button>
          </div>

          {/* Totals + GST */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                    GST %
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.gstPercent}
                    onChange={(e) =>
                      setField(
                        "gstPercent",
                        Number.parseFloat(e.target.value) || 0,
                      )
                    }
                    className="bg-muted border-border text-foreground"
                    data-ocid="quotation.gst.input"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                    Validity (days)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.validityDays}
                    onChange={(e) =>
                      setField(
                        "validityDays",
                        Number.parseInt(e.target.value) || 30,
                      )
                    }
                    className="bg-muted border-border text-foreground"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  Notes / Terms
                </Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  rows={4}
                  className="bg-muted border-border text-foreground resize-none text-xs"
                  data-ocid="quotation.notes.textarea"
                />
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-muted/50 rounded-lg border border-border p-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>
                    ₹
                    {subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>GST ({form.gstPercent}%)</span>
                  <span>
                    ₹
                    {gstAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-base font-bold text-foreground">
                    Total
                  </span>
                  <span className="text-base font-bold text-gold">
                    ₹
                    {totalAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border text-muted-foreground"
              data-ocid="quotation.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => handleSave(false)}
              className="border-gold/40 text-gold hover:bg-gold/10"
              data-ocid="quotation.save_draft_button"
            >
              {isPending && !saveAsSent && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save as Draft
            </Button>
            <Button
              disabled={isPending}
              onClick={() => handleSave(true)}
              className="bg-gold text-[#0A1220] hover:bg-gold/90 font-semibold gap-1"
              data-ocid="quotation.send_button"
            >
              {isPending && saveAsSent && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Send className="w-3.5 h-3.5" />
              Send to Customer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
