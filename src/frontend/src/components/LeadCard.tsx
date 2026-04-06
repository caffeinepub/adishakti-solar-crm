import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import type { Lead } from "../backend";
import { formatCurrency } from "../types";

interface LeadCardProps {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
  onView: (lead: Lead) => void;
  index: number;
}

export function LeadCard({ lead, onUpdate, onView, index }: LeadCardProps) {
  return (
    <div
      className="bg-card border border-border rounded-md p-3 flex flex-col gap-2 text-sm"
      data-ocid={`pipeline.item.${index}`}
    >
      <div
        className="font-semibold text-foreground truncate"
        title={lead.customerName}
      >
        {lead.customerName}
      </div>
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        <MapPin className="w-3 h-3 flex-shrink-0" />
        <span className="truncate">{lead.district}</span>
      </div>
      <div className="text-xs text-gold font-semibold">
        {formatCurrency(lead.requirements.estimatedValue)}
      </div>
      <div className="flex gap-1 mt-1">
        <Button
          size="sm"
          className="flex-1 h-7 text-xs bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
          onClick={() => onUpdate(lead)}
          data-ocid={`pipeline.edit_button.${index}`}
        >
          Update
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 text-xs border-border text-muted-foreground hover:text-foreground"
          onClick={() => onView(lead)}
          data-ocid={`pipeline.secondary_button.${index}`}
        >
          View
        </Button>
      </div>
    </div>
  );
}
