import { cn } from "@/lib/utils";
import { useState } from "react";
import { PipelineStage } from "../backend";
import { Layout } from "../components/Layout";
import { StageBadge } from "../components/StageBadge";
import {
  useAllLeads,
  useLeadsAddedToday,
  useLeadsByStageCount,
  useTotalLeadsCount,
} from "../hooks/useQueries";
import {
  PIPELINE_STAGES,
  STAGE_COLORS,
  STAGE_LABELS,
  formatCurrency,
} from "../types";

export default function Reports() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const { data: allLeads = [] } = useAllLeads();
  const { data: stageCount = [] } = useLeadsByStageCount();
  const { data: totalCount } = useTotalLeadsCount();
  const { data: todayCount } = useLeadsAddedToday();

  const filteredLeads = selectedDistrict
    ? allLeads.filter((l) => l.district === selectedDistrict)
    : allLeads;

  const totalValue = filteredLeads.reduce(
    (sum, l) => sum + l.requirements.estimatedValue,
    BigInt(0),
  );

  const closedWonLeads = filteredLeads.filter(
    (l) => l.stage === PipelineStage.closedWon,
  );
  const closedWonValue = closedWonLeads.reduce(
    (sum, l) => sum + l.requirements.estimatedValue,
    BigInt(0),
  );

  const maxStageCount = Math.max(
    1,
    ...stageCount.map(([, count]) => Number(count)),
  );

  const districtMap: Record<string, number> = {};
  for (const l of filteredLeads) {
    districtMap[l.district] = (districtMap[l.district] ?? 0) + 1;
  }
  const districtEntries = Object.entries(districtMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxDist = Math.max(1, ...districtEntries.map(([, v]) => v));

  return (
    <Layout
      selectedDistrict={selectedDistrict}
      onDistrictChange={setSelectedDistrict}
      showRightPanel={false}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
          Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sales pipeline analytics & performance
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Leads", value: String(totalCount ?? 0) },
          { label: "New Today", value: String(todayCount ?? 0) },
          { label: "Total Pipeline Value", value: formatCurrency(totalValue) },
          { label: "Closed Won Value", value: formatCurrency(closedWonValue) },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-card border border-border rounded-lg p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {item.label}
            </p>
            <p className="text-2xl font-extrabold text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Pipeline Stage Distribution
          </p>
          <div className="flex flex-col gap-3">
            {PIPELINE_STAGES.map((stage) => {
              const entry = stageCount.find(([s]) => s === stage);
              const count = Number(entry?.[1] ?? 0);
              const pct = Math.round((count / maxStageCount) * 100);
              const colors = STAGE_COLORS[stage];
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className="w-32 flex-shrink-0">
                    <StageBadge stage={stage} />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        colors.bg.replace("/40", ""),
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-6 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Leads by District
          </p>
          {districtEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {districtEntries.map(([district, count]) => (
                <div key={district} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 truncate">
                    {district}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold/60 transition-all"
                      style={{
                        width: `${Math.round((count / maxDist) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-6 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {closedWonLeads.length > 0 && (
        <div className="mt-4 bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Closed Won Leads
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Customer", "District", "Panel Size", "Value", "Date"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {closedWonLeads.map((lead, i) => (
                  <tr
                    key={lead.id.toString()}
                    className="border-b border-border/50 hover:bg-muted/20"
                    data-ocid={`reports.won.item.${i + 1}`}
                  >
                    <td className="px-3 py-2 text-foreground font-medium">
                      {lead.customerName}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {lead.district}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {lead.requirements.panelSize}
                    </td>
                    <td className="px-3 py-2 text-gold font-semibold">
                      {formatCurrency(lead.requirements.estimatedValue)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(
                        Number(lead.updatedAt / BigInt(1_000_000)),
                      ).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
