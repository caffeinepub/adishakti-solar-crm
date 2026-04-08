import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  CheckCircle2,
  Copy,
  Edit2,
  Key,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import type { UserProfile } from "../backend";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import {
  useAllDistricts,
  useAllUsers,
  useChangePassword,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
} from "../hooks/useQueries";
import { DEFAULT_DISTRICTS, ROLE_COLORS, ROLE_LABELS } from "../types";

// ── DISCOM Zone Data ───────────────────────────────────────────────────────

const DISCOM_ZONES: {
  code: string;
  name: string;
  color: string;
  textColor: string;
  districts: string[];
}[] = [
  {
    code: "TPNODL",
    name: "TP Northern Odisha Distribution Ltd",
    color: "bg-blue-900/40 border-blue-700/50",
    textColor: "text-blue-300",
    districts: [
      "Balasore",
      "Bhadrak",
      "Mayurbhanj",
      "Kendujhar",
      "Jajpur",
      "Jagatsinghpur",
      "Cuttack",
      "Kendrapara",
      "Dhenkanal",
      "Angul",
    ],
  },
  {
    code: "TPSODL",
    name: "TP Southern Odisha Distribution Ltd",
    color: "bg-emerald-900/40 border-emerald-700/50",
    textColor: "text-emerald-300",
    districts: [
      "Ganjam",
      "Gajapati",
      "Rayagada",
      "Koraput",
      "Malkangiri",
      "Nabarangpur",
      "Kandhamal",
      "Kalahandi",
    ],
  },
  {
    code: "TPWODL",
    name: "TP Western Odisha Distribution Ltd",
    color: "bg-amber-900/40 border-amber-700/50",
    textColor: "text-amber-300",
    districts: [
      "Sambalpur",
      "Bargarh",
      "Jharsuguda",
      "Sundargarh",
      "Deogarh",
      "Balangir",
      "Subarnapur",
      "Boudh",
      "Nuapada",
    ],
  },
  {
    code: "TPCODL",
    name: "TP Central Odisha Distribution Ltd",
    color: "bg-purple-900/40 border-purple-700/50",
    textColor: "text-purple-300",
    districts: ["Khordha", "Puri", "Nayagarh"],
  },
];

function getDiscomForDistrict(district: string): string {
  for (const zone of DISCOM_ZONES) {
    if (zone.districts.includes(district)) return zone.code;
  }
  return "—";
}

// ── Created User Credentials Dialog ───────────────────────────────────────

interface CreatedUserDialogProps {
  userId: string;
  password: string;
  name: string;
  role: UserRole;
  onClose: () => void;
}

function CreatedUserDialog({
  userId,
  password,
  name,
  role,
  onClose,
}: CreatedUserDialogProps) {
  const copy = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} copied!`));
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm bg-card border-border text-foreground"
        data-ocid="created_user.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-gold font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            User Created Successfully
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Share these login credentials with{" "}
            <span className="font-semibold text-foreground">{name}</span> (
            {ROLE_LABELS[role]}).
          </p>

          <div className="bg-muted rounded-lg p-4 flex flex-col gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                User ID
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono font-bold text-foreground bg-background/50 px-3 py-2 rounded border border-border">
                  {userId}
                </code>
                <button
                  type="button"
                  onClick={() => copy(userId, "User ID")}
                  className="p-2 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy user ID"
                  data-ocid="created_user.copy_userid"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                Password
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono font-bold text-gold bg-background/50 px-3 py-2 rounded border border-border">
                  {password}
                </code>
                <button
                  type="button"
                  onClick={() => copy(password, "Password")}
                  className="p-2 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy password"
                  data-ocid="created_user.copy_password"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            ⚠️ Save these credentials. The password will not be shown again.
          </p>

          <Button
            onClick={onClose}
            className="w-full bg-gold text-[#0A1220] hover:bg-gold/90 font-semibold"
            data-ocid="created_user.close_button"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit User Modal ────────────────────────────────────────────────────────

interface EditUserModalProps {
  user: UserProfile;
  districts: string[];
  onClose: () => void;
  onSave: (
    data: Partial<UserProfile> & { additionalDistricts?: string[] },
  ) => Promise<void>;
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
    additionalDistricts: [] as string[],
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

  const otherDistricts = allDistricts.filter((d) => d !== form.district);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg bg-card border-border text-foreground max-h-[90vh] overflow-y-auto"
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
              Primary District
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

          {/* Multiple Districts — dropdown multi-select */}
          {user.role === UserRole.sales && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-2 block">
                Additional Districts
                {form.additionalDistricts.length > 0 && (
                  <span className="ml-2 text-gold">
                    ({form.additionalDistricts.length} selected)
                  </span>
                )}
              </Label>
              <Select
                value=""
                onValueChange={(v) => {
                  if (v && !form.additionalDistricts.includes(v)) {
                    setForm((p) => ({
                      ...p,
                      additionalDistricts: [...p.additionalDistricts, v],
                    }));
                  }
                }}
              >
                <SelectTrigger
                  className="bg-muted border-border text-foreground text-xs"
                  data-ocid="edit_user.additional_district.select"
                >
                  <MapPin className="w-3 h-3 mr-1.5 text-muted-foreground flex-shrink-0" />
                  <SelectValue placeholder="Add a district…" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60 overflow-y-auto">
                  {otherDistricts
                    .filter((d) => !form.additionalDistricts.includes(d))
                    .map((d) => (
                      <SelectItem
                        key={d}
                        value={d}
                        className="text-foreground text-xs"
                      >
                        {d}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.additionalDistricts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.additionalDistricts.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-gold/15 border border-gold/30 text-gold font-semibold"
                    >
                      {d}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            additionalDistricts: p.additionalDistricts.filter(
                              (x) => x !== d,
                            ),
                          }))
                        }
                        className="hover:text-destructive transition-colors"
                        aria-label={`Remove ${d}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

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

// ── DISCOM Zone Reference ──────────────────────────────────────────────────

function DiscomZoneReference() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-gold" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Odisha DISCOM Zones
        </p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Distribution zones under Tata Power for electricity supply in Odisha.
        Each salesperson's district belongs to one zone.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DISCOM_ZONES.map((zone) => (
          <div
            key={zone.code}
            className={cn("rounded-lg border p-3", zone.color)}
            data-ocid={`discom.zone.${zone.code.toLowerCase()}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  zone.textColor,
                )}
              >
                {zone.code}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2 leading-tight">
              {zone.name}
            </p>
            <div className="flex flex-wrap gap-1">
              {zone.districts.map((d) => (
                <Badge
                  key={d}
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1.5 py-0 h-4 border-0 font-normal",
                    zone.color,
                    zone.textColor,
                  )}
                >
                  {d}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── New User Form ──────────────────────────────────────────────────────────

interface NewUserFormState {
  userId: string;
  password: string;
  name: string;
  role: UserRole;
  district: string;
  additionalDistricts: string[];
  phone: string;
  email: string;
  whatsAppNumber: string;
}

const EMPTY_FORM: NewUserFormState = {
  userId: "",
  password: "",
  name: "",
  role: UserRole.sales,
  district: "",
  additionalDistricts: [],
  phone: "",
  email: "",
  whatsAppNumber: "",
};

interface CreateUserFormProps {
  allDistricts: string[];
  onCreated: (
    userId: string,
    password: string,
    name: string,
    role: UserRole,
  ) => void;
}

function CreateUserForm({ allDistricts, onCreated }: CreateUserFormProps) {
  const [form, setForm] = useState<NewUserFormState>(EMPTY_FORM);
  const createUser = useCreateUser();

  const isSales = form.role === UserRole.sales;
  const otherDistricts = allDistricts.filter((d) => d !== form.district);

  const setField = <K extends keyof NewUserFormState>(
    f: K,
    v: NewUserFormState[K],
  ) => setForm((p) => ({ ...p, [f]: v }));

  const applyDiscomZone = (zone: (typeof DISCOM_ZONES)[number]) => {
    const primary =
      form.district && zone.districts.includes(form.district)
        ? form.district
        : zone.districts[0];
    const additional = zone.districts.filter((d) => d !== primary);
    setForm((p) => ({
      ...p,
      district: primary,
      additionalDistricts: additional,
    }));
    toast.success(
      `${zone.code} districts applied — ${zone.districts.length} districts assigned`,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.password || !form.name || !form.district) {
      toast.error("Username, Password, Name, and District are required.");
      return;
    }
    try {
      await createUser.mutateAsync({
        userId: form.userId,
        password: form.password,
        name: form.name,
        role: form.role,
        district: form.district,
        phone: form.phone,
        email: form.email,
        whatsAppNumber: form.whatsAppNumber,
      });
      onCreated(form.userId, form.password, form.name, form.role);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create user.";
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <Label className="text-xs text-muted-foreground uppercase mb-1 block">
          Username *
        </Label>
        <Input
          value={form.userId}
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
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          placeholder="Set a password"
          className="bg-muted border-border text-foreground text-sm font-mono"
          data-ocid="create_user.password.input"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          You will see the full credentials after creation
        </p>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground uppercase mb-1 block">
          Full Name *
        </Label>
        <Input
          value={form.name}
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
          value={form.role}
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
          Primary District *
        </Label>
        <Select
          value={form.district}
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

      {/* Additional Districts — Sales only, dropdown multi-select */}
      {isSales && form.district && (
        <div>
          <Label className="text-xs text-muted-foreground uppercase mb-1.5 block">
            Additional Districts
            {form.additionalDistricts.length > 0 && (
              <span className="ml-2 text-gold">
                ({form.additionalDistricts.length} selected)
              </span>
            )}
          </Label>
          <Select
            value=""
            onValueChange={(v) => {
              if (v && !form.additionalDistricts.includes(v)) {
                setForm((p) => ({
                  ...p,
                  additionalDistricts: [...p.additionalDistricts, v],
                }));
              }
            }}
          >
            <SelectTrigger
              className="bg-muted border-border text-foreground text-sm"
              data-ocid="create_user.additional_district.select"
            >
              <MapPin className="w-3 h-3 mr-1.5 text-muted-foreground flex-shrink-0" />
              <SelectValue placeholder="Add a district…" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60 overflow-y-auto">
              {otherDistricts
                .filter((d) => !form.additionalDistricts.includes(d))
                .map((d) => (
                  <SelectItem
                    key={d}
                    value={d}
                    className="text-foreground text-sm"
                  >
                    {d}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {form.additionalDistricts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.additionalDistricts.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-gold/15 border border-gold/30 text-gold font-semibold"
                >
                  {d}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        additionalDistricts: p.additionalDistricts.filter(
                          (x) => x !== d,
                        ),
                      }))
                    }
                    className="hover:text-destructive transition-colors"
                    aria-label={`Remove ${d}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <Label className="text-xs text-muted-foreground uppercase mb-1 block">
          Phone
        </Label>
        <Input
          value={form.phone}
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
          value={form.whatsAppNumber}
          onChange={(e) => setField("whatsAppNumber", e.target.value)}
          placeholder="91XXXXXXXXXX"
          className="bg-muted border-border text-foreground text-sm"
        />
      </div>

      {/* DISCOM Zone Quick-Assign — Sales only */}
      {isSales && (
        <div>
          <Label className="text-xs text-muted-foreground uppercase mb-1.5 block">
            Assign by DISCOM Zone
          </Label>
          <Select
            value=""
            onValueChange={(code) => {
              const zone = DISCOM_ZONES.find((z) => z.code === code);
              if (zone) applyDiscomZone(zone);
            }}
          >
            <SelectTrigger
              className="bg-muted border-border text-foreground text-sm"
              data-ocid="create_user.discom_zone.select"
            >
              <SelectValue placeholder="Select a zone to auto-assign districts…" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="TPCODL" className="text-foreground">
                TPCODL
              </SelectItem>
              <SelectItem value="TPNODL" className="text-foreground">
                TPNODL
              </SelectItem>
              <SelectItem value="TPSODL" className="text-foreground">
                TPSODL
              </SelectItem>
              <SelectItem value="TPWODL" className="text-foreground">
                TPWODL
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-1">
            Selecting a zone auto-assigns all its districts
          </p>
        </div>
      )}

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
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [changePwdUser, setChangePwdUser] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{
    userId: string;
    password: string;
    name: string;
    role: UserRole;
  } | null>(null);

  const { userRole } = useAuth();
  const { data: users = [], isLoading: usersLoading } = useAllUsers();
  const { data: districts = [] } = useAllDistricts();
  const allDistricts = districts.length > 0 ? districts : DEFAULT_DISTRICTS;

  const isAdmin = userRole === UserRole.admin;

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleUpdateUser = async (
    data: Partial<UserProfile> & { additionalDistricts?: string[] },
  ) => {
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

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.userId);
      toast.success(`User "${deleteTarget.userId}" deleted.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete user.";
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

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Create New User */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-gold" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Create New User
              </p>
            </div>
            <CreateUserForm
              allDistricts={allDistricts}
              onCreated={(userId, password, name, role) =>
                setCreatedCreds({ userId, password, name, role })
              }
            />
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
                {users.map((user, i) => {
                  const discom = getDiscomForDistrict(user.district);
                  return (
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
                          {user.district}
                          {discom !== "—" && (
                            <span className="ml-1 text-[10px] font-semibold opacity-70">
                              ({discom})
                            </span>
                          )}
                          {user.phone ? ` · ${user.phone}` : ""}
                          {user.whatsAppNumber
                            ? ` · WA: ${user.whatsAppNumber}`
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
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(user)}
                            aria-label="Delete user"
                            data-ocid={`users.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* DISCOM Zone Reference */}
      <DiscomZoneReference />

      {/* Created User Credentials */}
      {createdCreds && (
        <CreatedUserDialog
          userId={createdCreds.userId}
          password={createdCreds.password}
          name={createdCreds.name}
          role={createdCreds.role}
          onClose={() => setCreatedCreds(null)}
        />
      )}

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

      {/* Delete User Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent
          className="bg-card border-border"
          data-ocid="users.delete_dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete this user?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the account for{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name} (@{deleteTarget?.userId})
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-border text-muted-foreground"
              data-ocid="users.delete_cancel"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="users.delete_confirm"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
