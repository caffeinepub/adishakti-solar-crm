import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Printer, X } from "lucide-react";
import type { Quotation } from "../types";
import { QUOTATION_STATUS_COLORS, QUOTATION_STATUS_LABELS } from "../types";
import { formatDate } from "../types";

interface Props {
  quotation: Quotation;
  onClose: () => void;
  onEdit?: () => void;
}

function formatNum(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function validUntilDate(createdAt: bigint, validityDays: number): string {
  const ms = Number(createdAt / BigInt(1_000_000));
  const d = new Date(ms + validityDays * 24 * 60 * 60 * 1000);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function QuotationView({ quotation, onClose, onEdit }: Props) {
  const statusColor = QUOTATION_STATUS_COLORS[quotation.status];

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #quotation-print-area, #quotation-print-area * { visibility: visible !important; }
          #quotation-print-area { position: fixed; left: 0; top: 0; width: 100%; background: white !important; color: black !important; padding: 20px; }
          .no-print { display: none !important; }
          .print-table th, .print-table td { border: 1px solid #ccc !important; padding: 6px 10px !important; color: black !important; }
          .print-table { border-collapse: collapse; width: 100%; }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-4"
        data-ocid="quotation_view.modal"
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl mx-4 my-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border no-print">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border font-semibold",
                  statusColor.bg,
                  statusColor.text,
                  statusColor.border,
                )}
              >
                {QUOTATION_STATUS_LABELS[quotation.status]}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                #{quotation.quotationNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEdit}
                  className="h-7 text-xs border-gold/40 text-gold hover:bg-gold/10"
                  data-ocid="quotation_view.edit_button"
                >
                  Edit
                </Button>
              )}
              <Button
                size="sm"
                onClick={handlePrint}
                className="h-7 text-xs bg-gold text-[#0A1220] hover:bg-gold/90 gap-1"
                data-ocid="quotation_view.print_button"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div id="quotation-print-area" className="px-8 py-6 space-y-5">
            {/* Company Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-gold tracking-tight">
                  Shree Adishakti Solar Pvt Ltd
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Solar Energy Solutions
                </p>
                <p className="text-xs text-muted-foreground">Odisha, India</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-foreground tracking-widest uppercase">
                  Quotation
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  #{quotation.quotationNumber}
                </p>
              </div>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-3 gap-3 bg-muted/40 rounded-lg p-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">
                  Date
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(quotation.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">
                  Valid Until
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {validUntilDate(quotation.createdAt, quotation.validityDays)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">
                  System Type
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {quotation.systemType} · {quotation.panelCapacity} kW
                </p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="border border-border rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">
                Customer Details
              </p>
              <p className="text-sm font-bold text-foreground">
                {quotation.customerName}
              </p>
              {quotation.customerAddress && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {quotation.customerAddress}
                </p>
              )}
            </div>

            {/* Items Table */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">
                Itemized Breakdown
              </p>
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden print-table">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold border-b border-border">
                      #
                    </th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold border-b border-border">
                      Item
                    </th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold border-b border-border">
                      Description
                    </th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-semibold border-b border-border">
                      Qty
                    </th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-semibold border-b border-border">
                      Unit Price
                    </th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-semibold border-b border-border">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, i) => (
                    <tr
                      key={`${item.itemName}-${i}`}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="px-3 py-2 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2 font-semibold text-foreground">
                        {item.itemName}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {item.description}
                      </td>
                      <td className="px-3 py-2 text-right text-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right text-foreground">
                        ₹{formatNum(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-foreground">
                        ₹{formatNum(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 bg-muted/40 rounded-lg border border-border p-3 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{formatNum(quotation.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>GST ({quotation.gstPercent}%)</span>
                  <span>₹{formatNum(quotation.gstAmount)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-sm font-bold text-foreground">
                    Grand Total
                  </span>
                  <span className="text-base font-black text-gold">
                    ₹{formatNum(quotation.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {quotation.notes && (
              <div className="border border-border rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1.5">
                  Notes & Terms
                </p>
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {quotation.notes}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-end pt-2 border-t border-border/40">
              <p className="text-[10px] text-muted-foreground">
                Generated by Adishakti Solar CRM · Prepared by{" "}
                {quotation.createdBy}
              </p>
              <p className="text-[10px] text-muted-foreground">
                This quotation is valid for {quotation.validityDays} days from
                date of issue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
