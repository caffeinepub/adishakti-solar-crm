import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Clock, Loader2, Lock, Sun } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import {
  useAddUserProfile,
  useAllDistricts,
  useCallerProfile,
  useIsAdmin,
  useIsApproved,
  useRequestApproval,
  useSeedDistricts,
} from "../hooks/useQueries";
import { DEFAULT_DISTRICTS, ROLE_LABELS } from "../types";

export default function Login() {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: isApproved } = useIsApproved();
  const { data: isAdmin } = useIsAdmin();
  const { data: districts = [] } = useAllDistricts();

  const addProfile = useAddUserProfile();
  const requestApproval = useRequestApproval();
  const seedDistricts = useSeedDistricts();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    district: "",
    role: UserRole.sales,
  });

  const set = (field: string, value: string | UserRole) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.district) {
      toast.error("Name and District are required.");
      return;
    }
    if (!identity) return;

    try {
      if (districts.length === 0) {
        await seedDistricts.mutateAsync(DEFAULT_DISTRICTS);
      }

      await addProfile.mutateAsync({
        principal: identity.getPrincipal(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        district: form.district,
        role: form.role,
      });
      await requestApproval.mutateAsync();
      toast.success("Profile created! Waiting for admin approval.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create profile.";
      toast.error(msg);
    }
  };

  // Case 1: Not logged in — show login button
  if (!identity) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #0A1220 0%, #0E1B2D 100%)",
        }}
        data-ocid="login.page"
      >
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/20 border border-gold/30 mb-4">
              <Sun className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground uppercase tracking-tight">
              Shree Adishakti Solar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sales CRM Dashboard
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-4 h-4 text-gold" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Sign In
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Use Internet Identity to securely sign in to the Adishakti Solar
              CRM.
            </p>
            <Button
              className="w-full bg-gold text-navy-800 hover:bg-gold-dark font-bold text-sm"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                  in...
                </>
              ) : (
                "Sign In with Internet Identity"
              )}
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-6">
            Secure, decentralized authentication on the Internet Computer
          </p>
        </div>
      </div>
    );
  }

  // Case 2: Logged in but no profile — show setup form
  if (!profile) {
    const allDistricts = districts.length > 0 ? districts : DEFAULT_DISTRICTS;
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #0A1220 0%, #0E1B2D 100%)",
        }}
        data-ocid="profile.page"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/20 border border-gold/30 mb-3">
              <Sun className="w-6 h-6 text-gold" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground uppercase tracking-tight">
              Setup Your Profile
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Complete your staff profile to continue
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <form onSubmit={handleProfileSetup} className="flex flex-col gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  Full Name *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Your full name"
                  className="bg-muted border-border text-foreground"
                  data-ocid="profile.name.input"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  Email
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="your@email.com"
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  Phone
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase mb-1 block">
                  District *
                </Label>
                <Select
                  value={form.district}
                  onValueChange={(v) => set("district", v)}
                >
                  <SelectTrigger
                    className="bg-muted border-border text-foreground"
                    data-ocid="profile.district.select"
                  >
                    <SelectValue placeholder="Select your district" />
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
                  Role
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => set("role", v as UserRole)}
                >
                  <SelectTrigger
                    className="bg-muted border-border text-foreground"
                    data-ocid="profile.role.select"
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
              <Button
                type="submit"
                className="w-full bg-gold text-navy-800 hover:bg-gold-dark font-bold"
                disabled={addProfile.isPending || requestApproval.isPending}
                data-ocid="profile.submit_button"
              >
                {addProfile.isPending || requestApproval.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting
                    up...
                  </>
                ) : (
                  "Create Profile & Request Access"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Profile exists but not yet approved
  if (!isAdmin && !isApproved) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(135deg, #0A1220 0%, #0E1B2D 100%)",
        }}
        data-ocid="pending.page"
      >
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-900/30 border border-amber-700/50 mb-4">
            <Clock className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground uppercase tracking-tight">
            Pending Approval
          </h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Hello{" "}
            <span className="text-foreground font-semibold">
              {profile.name}
            </span>
            , your account is awaiting admin approval. You will be notified once
            access is granted.
          </p>
          <div className="bg-card border border-amber-700/30 rounded-xl p-4 text-left">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-semibold">Role:</span>{" "}
              {ROLE_LABELS[profile.role]}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-foreground font-semibold">District:</span>{" "}
              {profile.district}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-border text-muted-foreground"
            onClick={() => window.location.reload()}
            data-ocid="pending.reload.button"
          >
            Check Again
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
