import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login, sessionToken, profile } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (sessionToken && profile) {
      window.location.href = "/";
    }
  }, [sessionToken, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const err = await login(username.trim(), password.trim());
      if (err) {
        setError("Invalid username or password");
      } else {
        toast.success("Logged in successfully!");
        window.location.href = "/";
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #0A1220 0%, #0E1B2D 100%)",
      }}
      data-ocid="login.page"
    >
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/20 border border-gold/30 mb-4">
            <img
              src="/assets/logo.jpeg"
              alt="Shree Adishakti Solar logo"
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                const t = e.currentTarget;
                t.style.display = "none";
                const parent = t.parentElement;
                if (parent) {
                  const icon = document.createElement("span");
                  icon.innerHTML = "☀️";
                  icon.className = "text-2xl";
                  parent.appendChild(icon);
                }
              }}
            />
          </div>
          <h1 className="text-xl font-extrabold text-foreground uppercase tracking-tight">
            Shree Adishakti Solar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sales CRM Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
              Sign In
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1.5 block">
                Username
              </Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-muted border-border text-foreground"
                autoComplete="username"
                data-ocid="login.username.input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase mb-1.5 block">
                Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-muted border-border text-foreground"
                autoComplete="current-password"
                data-ocid="login.password.input"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gold text-[#0A1220] hover:bg-gold/90 font-bold text-sm mt-1"
              disabled={loading}
              data-ocid="login.primary_button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                  in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          Contact your admin for account access
        </p>
        <p className="text-center text-[10px] text-muted-foreground mt-1">
          Default admin:{" "}
          <span className="text-foreground font-mono">admin / Admin@1234</span>
        </p>
      </div>
    </div>
  );
}
