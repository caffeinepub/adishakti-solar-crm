import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { Layout } from "../components/Layout";
import { StageBadge } from "../components/StageBadge";
import { useAuth } from "../hooks/useAuth";
import {
  useAllDistricts,
  useAllLeads,
  useAllUsers,
  useAssignLeadToOperations,
  useAssignLeadToSales,
} from "../hooks/useQueries";
import { canAssignLeads, formatCurrency, formatDate } from "../types";

export default function Assignments() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const { userRole } = useAuth();

  const { data: allLeads = [], isLoading } = useAllLeads();
  const { data: users = [] } = useAllUsers();
  const assignSales = useAssignLeadToSales();
  const assignOps = useAssignLeadToOperations();

  const salesUsers = users.filter((u) => u.role === UserRole.sales);
  const opsUsers = users.filter((u) => u.role === UserRole.operation);

  const canAssign = userRole ? canAssignLeads(userRole) : false;

  const filteredLeads = selectedDistrict
    ? allLeads.filter((l) => l.district === selectedDistrict)
    : allLeads;

  const handleAssignSales = async (leadId: bigint, userId: string) => {
    if (userId === "__none__") return;
    try {
      await assignSales.mutateAsync({ leadId, salesUserId: userId });
      toast.success("Sales person assigned!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign.";
      toast.error(msg);
    }
  };

  const handleAssignOps = async (leadId: bigint, userId: string) => {
    if (userId === "__none__") return;
    try {
      await assignOps.mutateAsync({ leadId, operationsUserId: userId });
      toast.success("Operations person assigned!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign.";
      toast.error(msg);
    }
  };

  const buildWhatsAppLink = (
    lead: (typeof allLeads)[number],
    salesUser: (typeof salesUsers)[number],
  ) => {
    const msg = `Lead Details: ${lead.customerName}, Phone: ${lead.phone}, District: ${lead.district}, Requirements: ${lead.requirements.systemType}, ${lead.requirements.panelSize}kW, Est. Value: ₹${lead.requirements.estimatedValue}`;
    const phone = salesUser.whatsAppNumber.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <Layout
      selectedDistrict={selectedDistrict}
      onDistrictChange={setSelectedDistrict}
      showRightPanel={false}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
          Assignments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {canAssign
            ? "Assign leads to sales & operations team members by district"
            : "View lead assignments"}
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div
            className="p-4 flex flex-col gap-2"
            data-ocid="assignments.loading_state"
          >
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div
            className="p-10 text-center text-muted-foreground"
            data-ocid="assignments.empty_state"
          >
            No leads to assign.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Customer",
                    "District",
                    "Stage",
                    "Value",
                    "Sales Person",
                    "WhatsApp",
                    "Operations",
                    "Added",
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
                {filteredLeads.map((lead, i) => {
                  const currentSales = salesUsers.find(
                    (u) => u.userId === lead.assignedSalesPerson,
                  );
                  const currentOps = opsUsers.find(
                    (u) => u.userId === lead.assignedOperationsPerson,
                  );

                  return (
                    <tr
                      key={lead.id.toString()}
                      className="border-b border-border/50 hover:bg-muted/20"
                      data-ocid={`assignments.item.${i + 1}`}
                    >
                      <td className="px-3 py-2 font-medium text-foreground max-w-[120px] truncate">
                        {lead.customerName}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {lead.district}
                      </td>
                      <td className="px-3 py-2">
                        <StageBadge stage={lead.stage} />
                      </td>
                      <td className="px-3 py-2 text-gold font-semibold">
                        {formatCurrency(lead.requirements.estimatedValue)}
                      </td>
                      <td className="px-3 py-2">
                        {canAssign ? (
                          <Select
                            value={currentSales?.userId ?? "__none__"}
                            onValueChange={(v) => handleAssignSales(lead.id, v)}
                          >
                            <SelectTrigger
                              className="w-36 h-8 text-xs bg-muted border-border text-foreground"
                              data-ocid={`assignments.sales.select.${i + 1}`}
                            >
                              <SelectValue placeholder="Assign sales" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem
                                value="__none__"
                                className="text-muted-foreground text-xs"
                              >
                                Unassigned
                              </SelectItem>
                              {salesUsers.map((u) => (
                                <SelectItem
                                  key={u.userId}
                                  value={u.userId}
                                  className="text-xs text-foreground"
                                >
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {currentSales?.name ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {currentSales?.whatsAppNumber ? (
                          <a
                            href={buildWhatsAppLink(lead, currentSales)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] bg-green-900/40 text-green-300 border border-green-700/50 rounded px-2 py-1 font-semibold hover:bg-green-900/60 transition-colors"
                            data-ocid={`assignments.whatsapp.${i + 1}`}
                          >
                            <span>📱</span> WhatsApp
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {canAssign ? (
                          <Select
                            value={currentOps?.userId ?? "__none__"}
                            onValueChange={(v) => handleAssignOps(lead.id, v)}
                          >
                            <SelectTrigger
                              className="w-36 h-8 text-xs bg-muted border-border text-foreground"
                              data-ocid={`assignments.ops.select.${i + 1}`}
                            >
                              <SelectValue placeholder="Assign ops" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem
                                value="__none__"
                                className="text-muted-foreground text-xs"
                              >
                                Unassigned
                              </SelectItem>
                              {opsUsers.map((u) => (
                                <SelectItem
                                  key={u.userId}
                                  value={u.userId}
                                  className="text-xs text-foreground"
                                >
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {currentOps?.name ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
