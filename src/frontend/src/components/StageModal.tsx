import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Mail, MapPin, Phone, User, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Lead } from "../backend";
import { PipelineStage } from "../backend";
import {
  PIPELINE_STAGES,
  STAGE_COLORS,
  STAGE_LABELS,
  formatCurrency,
  formatDate,
} from "../types";
import { StageBadge } from "./StageBadge";

interface StageModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  onUpdateStage: (
    id: bigint,
    stage: PipelineStage,
    notes: string,
  ) => Promise<void>;
}

export function StageModal({
  open,
  onClose,
  lead,
  onUpdateStage,
}: StageModalProps) {
  const [stage, setStage] = useState<PipelineStage>(
    lead?.stage ?? PipelineStage.inquiry,
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    setLoading(true);
    try {
      await onUpdateStage(lead.id, stage, notes);
      toast.success("Stage updated!");
      setNotes("");
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update stage.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg bg-card border-border text-foreground"
        data-ocid="stage.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-gold font-bold">
            Update Lead Stage
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted rounded-lg p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gold" />
            <span className="font-semibold text-foreground">
              {lead.customerName}
            </span>
            <StageBadge stage={lead.stage} className="ml-auto" />
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {lead.district}
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> {lead.phone}
            </div>
            {lead.email && (
              <div className="flex items-center gap-1 col-span-2">
                <Mail className="w-3 h-3" /> {lead.email}
              </div>
            )}
            <div className="flex items-center gap-1 col-span-2 text-gold font-semibold">
              <Zap className="w-3 h-3" />
              {lead.requirements.panelSize} | {lead.requirements.systemType} |{" "}
              {formatCurrency(lead.requirements.estimatedValue)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Added: {formatDate(lead.createdAt)}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {PIPELINE_STAGES.map((s) => {
            const colors = STAGE_COLORS[s];
            const isActive = s === stage;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={cn(
                  "text-xs px-2 py-1 rounded border transition-all",
                  isActive
                    ? `${colors.bg} ${colors.text} ${colors.border} font-semibold`
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted",
                )}
                data-ocid="stage.tab"
              >
                {STAGE_LABELS[s]}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <Label className="text-xs text-muted-foreground uppercase mb-1 block">
              New Stage
            </Label>
            <Select
              value={stage}
              onValueChange={(v) => setStage(v as PipelineStage)}
            >
              <SelectTrigger
                className="bg-muted border-border text-foreground"
                data-ocid="stage.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {PIPELINE_STAGES.map((s) => (
                  <SelectItem key={s} value={s} className="text-foreground">
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase mb-1 block">
              Update Notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for stage change, observations..."
              rows={3}
              className="bg-muted border-border text-foreground resize-none"
              data-ocid="stage.textarea"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-muted-foreground"
              data-ocid="stage.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gold text-navy-800 hover:bg-gold-dark font-semibold"
              data-ocid="stage.submit_button"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Stage
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
