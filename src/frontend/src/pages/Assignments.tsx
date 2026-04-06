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
import type { Lead } from "../backend";
import { UserRole } from "../backend";
import { Layout } from "../components/Layout";
import { StageBadge } from "../components/StageBadge";
import {
  useAllDistricts,
  useAllLeads,
  useAllUsers,
  useAssignLeadToOperations,
  useAssignLeadToSales,
} from "../hooks/useQueries";
import { formatCurrency, formatDate } from "../types";

export default function Assignments() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const { data: allLeads = [], isLoading } = useAllLeads();
  const { data: users = [] } = useAllUsers();
  const assignSales = useAssignLeadToSales();
  const assignOps = useAssignLeadToOperations();

  const salesUsers = users.filter((u) => u.role === UserRole.sales);
  const opsUsers = users.filter((u) => u.role === UserRole.operations);

  const filteredLeads = selectedDistrict
    ? allLeads.filter((l) => l.district === selectedDistrict)
    : allLeads;

  const handleAssignSales = async (leadId: bigint, principalStr: string) => {
    if (principalStr === "__none__") return;
    const user = salesUsers.find(
      (u) => u.principal.toString() === principalStr,
    );
    if (!user) return;
    try {
      await assignSales.mutateAsync({ leadId, salesPerson: user.principal });
      toast.success("Sales person assigned!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to assign.");
    }
  };

  const handleAssignOps = async (leadId: bigint, principalStr: string) => {
    if (principalStr === "__none__") return;
    const user = opsUsers.find((u) => u.principal.toString() === principalStr);
    if (!user) return;
    try {
      await assignOps.mutateAsync({ leadId, opsPerson: user.principal });
      toast.success("Operations person assigned!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to assign.");
    }
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
          Assign leads to sales & operations team members by district
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
                    (u) =>
                      u.principal.toString() ===
                      lead.assignedSalesPerson?.toString(),
                  );
                  const currentOps = opsUsers.find(
                    (u) =>
                      u.principal.toString() ===
                      lead.assignedOperationsPerson?.toString(),
                  );

                  return (
                    <tr
                      key={lead.id.toString()}
                      className="border-b border-border/50 hover:bg-muted/20"
                      data-ocid={`assignments.item.${i + 1}`}
                    >
                      <td className="px-3 py-2 font-medium text-foreground">
                        {lead.customerName}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {lead.district}
                      </td>
                      <td className="px-3 py-2">
                        <StageBadge stage={lead.stage} />
                      </td>
                      <td className="px-3 py-2 text-gold font-semibold">
                        {formatCurrency(lead.requirements.estimatedValue)}
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={
                            currentSales?.principal.toString() ?? "__none__"
                          }
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
                                key={u.principal.toString()}
                                value={u.principal.toString()}
                                className="text-xs text-foreground"
                              >
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={currentOps?.principal.toString() ?? "__none__"}
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
                                key={u.principal.toString()}
                                value={u.principal.toString()}
                                className="text-xs text-foreground"
                              >
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
