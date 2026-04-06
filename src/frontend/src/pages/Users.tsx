import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Check,
  Loader2,
  MapPin,
  Plus,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApprovalStatus, UserRole } from "../backend";
import { Layout } from "../components/Layout";
import {
  useAddDistrict,
  useAllDistricts,
  useAllUsers,
  useListApprovals,
  useSetApproval,
} from "../hooks/useQueries";
import { ROLE_LABELS } from "../types";
import { truncatePrincipal } from "../types";

export default function UsersPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [newDistrict, setNewDistrict] = useState("");

  const { data: users = [], isLoading: usersLoading } = useAllUsers();
  const { data: approvals = [], isLoading: approvalsLoading } =
    useListApprovals();
  const { data: districts = [] } = useAllDistricts();
  const setApproval = useSetApproval();
  const addDistrict = useAddDistrict();

  const pendingApprovals = approvals.filter(
    (a) => a.status === ApprovalStatus.pending,
  );

  const handleApprove = async (user: any) => {
    try {
      await setApproval.mutateAsync({
        user: user.principal,
        status: ApprovalStatus.approved,
      });
      toast.success("User approved!");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve.");
    }
  };

  const handleReject = async (user: any) => {
    try {
      await setApproval.mutateAsync({
        user: user.principal,
        status: ApprovalStatus.rejected,
      });
      toast.success("User rejected.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reject.");
    }
  };

  const handleAddDistrict = async () => {
    if (!newDistrict.trim()) return;
    try {
      await addDistrict.mutateAsync(newDistrict.trim());
      setNewDistrict("");
      toast.success(`District "${newDistrict}" added!`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to add district.");
    }
  };

  const roleColor = (role: UserRole) => {
    if (role === UserRole.admin) return "bg-gold/20 text-gold border-gold/30";
    if (role === UserRole.sales)
      return "bg-blue-900/40 text-blue-300 border-blue-700/50";
    return "bg-emerald-900/40 text-emerald-300 border-emerald-700/50";
  };

  return (
    <Layout
      selectedDistrict={selectedDistrict}
      onDistrictChange={setSelectedDistrict}
      showRightPanel={false}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
          User Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage staff accounts, roles, and approvals
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Pending Approvals */}
        <div className="md:col-span-1">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-gold" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Pending Approvals
              </p>
              {pendingApprovals.length > 0 && (
                <span className="ml-auto text-xs bg-amber-900/50 text-amber-300 border border-amber-700/50 rounded-full px-2 py-0.5 font-bold">
                  {pendingApprovals.length}
                </span>
              )}
            </div>

            {approvalsLoading ? (
              <div data-ocid="approvals.loading_state">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full mb-2" />
                ))}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <p
                className="text-xs text-muted-foreground text-center py-4"
                data-ocid="approvals.empty_state"
              >
                No pending approvals
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingApprovals.map((approval, i) => {
                  const userProfile = users.find(
                    (u) =>
                      u.principal.toString() === approval.principal.toString(),
                  );
                  return (
                    <div
                      key={approval.principal.toString()}
                      className="bg-muted rounded-lg p-3 flex items-center gap-2"
                      data-ocid={`approvals.item.${i + 1}`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs bg-muted-foreground/20 text-muted-foreground">
                          {userProfile?.name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {userProfile?.name ??
                            truncatePrincipal(approval.principal)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {userProfile?.district ?? ""}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-6 w-6 p-0 bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/50"
                          onClick={() => handleApprove(approval)}
                          data-ocid={`approvals.confirm_button.${i + 1}`}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-6 w-6 p-0 bg-red-900/50 hover:bg-red-800/60 text-red-300 border border-red-700/50"
                          onClick={() => handleReject(approval)}
                          data-ocid={`approvals.delete_button.${i + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* District Management */}
          <div className="bg-card rounded-lg border border-border p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gold" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Districts
              </p>
            </div>
            <div className="flex gap-2 mb-3">
              <Input
                value={newDistrict}
                onChange={(e) => setNewDistrict(e.target.value)}
                placeholder="New district name"
                className="bg-muted border-border text-foreground text-xs h-8"
                onKeyDown={(e) => e.key === "Enter" && handleAddDistrict()}
                data-ocid="district.input"
              />
              <Button
                size="sm"
                className="h-8 bg-gold text-navy-800 hover:bg-gold-dark"
                onClick={handleAddDistrict}
                disabled={addDistrict.isPending}
                data-ocid="district.add_button"
              >
                {addDistrict.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {districts.map((d) => (
                <span
                  key={d}
                  className="text-[10px] bg-muted text-muted-foreground border border-border rounded px-2 py-0.5"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gold" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                All Staff
              </p>
              <span className="ml-auto text-xs text-muted-foreground">
                {users.length} users
              </span>
            </div>

            {usersLoading ? (
              <div data-ocid="users.loading_state">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full mb-2" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p
                className="text-xs text-muted-foreground text-center py-4"
                data-ocid="users.empty_state"
              >
                No users found.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {users.map((user, i) => {
                  const approval = approvals.find(
                    (a) => a.principal.toString() === user.principal.toString(),
                  );
                  return (
                    <div
                      key={user.principal.toString()}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                      data-ocid={`users.item.${i + 1}`}
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="text-sm bg-gold/20 text-gold">
                          {user.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email} · {user.district}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded border font-semibold",
                            roleColor(user.role),
                          )}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                        {approval && (
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded border font-semibold",
                              approval.status === ApprovalStatus.approved
                                ? "bg-green-900/40 text-green-300 border-green-700/50"
                                : approval.status === ApprovalStatus.rejected
                                  ? "bg-red-900/40 text-red-300 border-red-700/50"
                                  : "bg-amber-900/40 text-amber-300 border-amber-700/50",
                            )}
                          >
                            {approval.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
