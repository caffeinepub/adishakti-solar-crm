import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Edit2,
  Key,
  Loader2,
  MapPin,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import type { UserProfile } from "../backend";
import { Layout } from "../components/Layout";
import {
  useAddDistrict,
  useAllDistricts,
  useAllUsers,
  useChangePassword,
  useCreateUser,
  useUpdateUser,
} from "../hooks/useQueries";
import { DEFAULT_DISTRICTS, ROLE_COLORS, ROLE_LABELS } from "../types";

// ── Edit User Modal ────────────────────────────────────────────────────────

interface EditUserModalProps {
  user: UserProfile;
  districts: string[];
  onClose: () => void;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
}

function EditUserModal({
  user,
  districts,
  onClose,
  onSave,
}: EditUserModalProps) {
  const allDistricts = districts.length > 0 ? districts : DEFAULT_DISTRICTS;
  const [form, setForm] = useState({
    name: user.name,
    district: user.district,
    phone: user.phone,
    email: user.email,
    whatsAppNumber: user.whatsAppNumber,
    isActive: user.isActive,
  });
  const [loading, setLoading] = useState(false);
  const set = (f: string, v: string | boolean) =>
    setForm((p) => ({ ...p, [f]: v }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(form);
      toast.success("User updated!");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update user.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md bg-card border-border text-foreground"
        data-ocid="edit_user.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-gold font-bold">
            Edit User — {user.userId}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-xs text-muted-foreground uppercase mb-1 block">
              Full Name
            </Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="bg-muted border-border text-foreground"
              data-ocid="edit_user.name.input"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase mb-1 block">
              District
            </Label>
            <Select
              value={form.district}
              onValueChange={(v) => set("district", v)}
            >
              <SelectTrigger
                className="bg-muted border-border text-foreground"
                data-ocid="edit_user.district.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {allDistricts.map((d) => (
                  <SelectItem key={d} value={d} className="text-foreground">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                Phone
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
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
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase mb-1 block">
              WhatsApp Number
            </Label>
            <Input
              value={form.whatsAppNumber}
              onChange={(e) => set("whatsAppNumber", e.target.value)}
              placeholder="91XXXXXXXXXX"
              className="bg-muted border-border text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => set("isActive", v)}
              data-ocid="edit_user.active.toggle"
            />
            <Label className="text-xs text-muted-foreground">
              Active Account
            </Label>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border text-muted-foreground"
              data-ocid="edit_user.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-gold text-[#0A1220] hover:bg-gold/90 font-semibold"
              data-ocid="edit_user.save_button"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{" "}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Change Password Modal ──────────────────────────────────────────────────

interface ChangePasswordModalProps {
  userId: string;
  onClose: () => void;
}

function ChangePasswordModal({ userId, onClose }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const changePassword = useChangePassword();

  const handleSave = async () => {
    if (!newPassword.trim()) {
      toast.error("Password cannot be empty.");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      await changePassword.mutateAsync({ userId, newPassword });
      toast.success("Password changed successfully!");
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to change password.";
      toast.error(msg);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm bg-card border-border text-foreground"
        data-ocid="change_password.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-gold font-bold">
            Change Password — {userId}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-xs text-muted-foreground uppercase mb-1 block">
              New Password
            </Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-muted border-border text-foreground"
              data-ocid="change_password.input"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase mb-1 block">
              Confirm Password
            </Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="bg-muted border-border text-foreground"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={changePassword.isPending}
              className="bg-gold text-[#0A1220] hover:bg-gold/90 font-semibold"
              data-ocid="change_password.submit_button"
            >
              {changePassword.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}{" "}
              Set Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [changePwdUser, setChangePwdUser] = useState<string | null>(null);
  const [newDistrict, setNewDistrict] = useState("");

  const { data: users = [], isLoading: usersLoading } = useAllUsers();
  const { data: districts = [] } = useAllDistricts();
  const allDistricts = districts.length > 0 ? districts : DEFAULT_DISTRICTS;

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { mutateAsync: addDistrict, isPending: addingDistrict } =
    useAddDistrict();

  const [newUserForm, setNewUserForm] = useState({
    userId: "",
    password: "",
    name: "",
    role: UserRole.sales as UserRole,
    district: "",
    phone: "",
    email: "",
    whatsAppNumber: "",
  });
  const setField = (f: string, v: string | UserRole) =>
    setNewUserForm((p) => ({ ...p, [f]: v }));

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newUserForm.userId ||
      !newUserForm.password ||
      !newUserForm.name ||
      !newUserForm.district
    ) {
      toast.error("Username, Password, Name, and District are required.");
      return;
    }
    try {
      await createUser.mutateAsync(newUserForm);
      toast.success(`User "${newUserForm.userId}" created!`);
      setNewUserForm({
        userId: "",
        password: "",
        name: "",
        role: UserRole.sales,
        district: "",
        phone: "",
        email: "",
        whatsAppNumber: "",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create user.";
      toast.error(msg);
    }
  };

  const handleUpdateUser = async (data: Partial<UserProfile>) => {
    if (!editingUser) return;
    await updateUser.mutateAsync({
      userId: editingUser.userId,
      name: data.name ?? editingUser.name,
      district: data.district ?? editingUser.district,
      phone: data.phone ?? editingUser.phone,
      email: data.email ?? editingUser.email,
      whatsAppNumber: data.whatsAppNumber ?? editingUser.whatsAppNumber,
      isActive: data.isActive ?? editingUser.isActive,
    });
  };

  const handleAddDistrict = async () => {
    if (!newDistrict.trim()) return;
    try {
      await addDistrict(newDistrict.trim());
      setNewDistrict("");
      toast.success(`District "${newDistrict}" added!`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to add district.";
      toast.error(msg);
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
          User Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create and manage staff accounts with role-based access
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Create New User */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-gold" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Create New User
              </p>
            </div>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  Username *
                </Label>
                <Input
                  value={newUserForm.userId}
                  onChange={(e) => setField("userId", e.target.value)}
                  placeholder="e.g. rajan123"
                  className="bg-muted border-border text-foreground text-sm"
                  data-ocid="create_user.username.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  Password *
                </Label>
                <Input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted border-border text-foreground text-sm"
                  data-ocid="create_user.password.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  Full Name *
                </Label>
                <Input
                  value={newUserForm.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Full name"
                  className="bg-muted border-border text-foreground text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  Role *
                </Label>
                <Select
                  value={newUserForm.role}
                  onValueChange={(v) => setField("role", v as UserRole)}
                >
                  <SelectTrigger
                    className="bg-muted border-border text-foreground text-sm"
                    data-ocid="create_user.role.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {Object.values(UserRole).map((r) => (
                      <SelectItem key={r} value={r} className="text-foreground">
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  District *
                </Label>
                <Select
                  value={newUserForm.district}
                  onValueChange={(v) => setField("district", v)}
                >
                  <SelectTrigger
                    className="bg-muted border-border text-foreground text-sm"
                    data-ocid="create_user.district.select"
                  >
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {allDistricts.map((d) => (
                      <SelectItem key={d} value={d} className="text-foreground">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  Phone
                </Label>
                <Input
                  value={newUserForm.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="+91 XXXXXXXXXX"
                  className="bg-muted border-border text-foreground text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  WhatsApp Number
                </Label>
                <Input
                  value={newUserForm.whatsAppNumber}
                  onChange={(e) => setField("whatsAppNumber", e.target.value)}
                  placeholder="91XXXXXXXXXX"
                  className="bg-muted border-border text-foreground text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={createUser.isPending}
                className="w-full bg-gold text-[#0A1220] hover:bg-gold/90 font-bold mt-1"
                data-ocid="create_user.submit_button"
              >
                {createUser.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create User
              </Button>
            </form>
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
                className="h-8 bg-gold text-[#0A1220] hover:bg-gold/90"
                onClick={handleAddDistrict}
                disabled={addingDistrict}
                data-ocid="district.add_button"
              >
                {addingDistrict ? (
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

        {/* Users Table */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
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
                  <Skeleton key={i} className="h-16 w-full mb-2" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p
                className="text-xs text-muted-foreground text-center py-8"
                data-ocid="users.empty_state"
              >
                No users yet. Create the first user above.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {users.map((user, i) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    data-ocid={`users.item.${i + 1}`}
                  >
                    <Avatar className="w-9 h-9 flex-shrink-0">
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user.name}
                        </p>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          @{user.userId}
                        </span>
                        {!user.isActive && (
                          <span className="text-[10px] bg-red-900/40 text-red-300 border border-red-700/50 rounded px-1.5 py-0.5 font-semibold">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.district} · {user.phone || "—"}{" "}
                        {user.whatsAppNumber
                          ? `· WA: ${user.whatsAppNumber}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded border font-semibold",
                          ROLE_COLORS[user.role],
                        )}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-gold"
                        onClick={() => setEditingUser(user)}
                        aria-label="Edit user"
                        data-ocid={`users.edit_button.${i + 1}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-300"
                        onClick={() => setChangePwdUser(user.userId)}
                        aria-label="Change password"
                        data-ocid={`users.password_button.${i + 1}`}
                      >
                        <Key className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          districts={districts}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateUser}
        />
      )}
      {changePwdUser && (
        <ChangePasswordModal
          userId={changePwdUser}
          onClose={() => setChangePwdUser(null)}
        />
      )}
    </Layout>
  );
}
