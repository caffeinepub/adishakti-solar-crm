import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
  accent?: boolean;
}

export function KPICard({
  title,
  value,
  icon,
  trend,
  trendUp,
  loading,
  accent,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border p-4 flex flex-col gap-2 overflow-hidden",
        accent ? "bg-[#1a2a10] border-gold/30" : "bg-card border-border",
      )}
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <span
          className={cn(
            "p-1.5 rounded",
            accent ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="text-3xl font-extrabold text-foreground tracking-tight">
          {value}
        </div>
      )}
      {trend && (
        <div
          className={cn(
            "text-xs font-medium",
            trendUp ? "text-green-400" : "text-red-400",
          )}
        >
          {trendUp ? "▲" : "▼"} {trend}
        </div>
      )}
      {/* Decorative corner */}
      {accent && (
        <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-gold/10" />
      )}
    </div>
  );
}
