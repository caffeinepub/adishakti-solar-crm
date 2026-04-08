import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart2,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAllDistricts } from "../hooks/useQueries";
import { DEFAULT_DISTRICTS, ROLE_LABELS, UserRole, isAdmin } from "../types";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/" as const, icon: LayoutDashboard },
  { label: "Leads", to: "/leads" as const, icon: ClipboardList },
  { label: "Pipeline", to: "/pipeline" as const, icon: Layers },
  { label: "Assignments", to: "/assignments" as const, icon: UserCheck },
  { label: "Reports", to: "/reports" as const, icon: BarChart2 },
  { label: "Users", to: "/users" as const, icon: Users, adminOnly: true },
];

interface LayoutProps {
  children: React.ReactNode;
  selectedDistrict?: string | null;
  onDistrictChange?: (d: string | null) => void;
  showRightPanel?: boolean;
  onAddLead?: () => void;
  onScheduleSurvey?: () => void;
  onAssignLeads?: () => void;
}

export function Layout({
  children,
  selectedDistrict,
  onDistrictChange,
  showRightPanel = true,
  onAddLead,
  onScheduleSurvey,
  onAssignLeads,
}: LayoutProps) {
  const { profile, userRole, logout } = useAuth();
  const { data: districts = [] } = useAllDistricts();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const adminUser = userRole ? isAdmin(userRole) : false;

  const allDistricts = districts.length > 0 ? districts : DEFAULT_DISTRICTS;

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #0A1220 0%, #0E1B2D 100%)",
      }}
    >
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-4 border-b"
        style={{ background: "#0D192B", borderColor: "#26364A" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            className="md:hidden text-muted-foreground mr-1"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation"
            data-ocid="nav.toggle"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <img
            src="/assets/generated/solar-logo-transparent.dim_60x60.png"
            alt="logo"
            className="w-7 h-7 rounded-full"
          />
          <span className="font-bold text-xs md:text-sm tracking-tight text-foreground hidden sm:block">
            SHREE ADISHAKTI SOLAR
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.filter((item) => !item.adminOnly || adminUser).map(
            (item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors relative text-muted-foreground hover:text-foreground",
                )}
                activeProps={{
                  className:
                    "text-gold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gold",
                }}
                data-ocid={`nav.${item.label.toLowerCase()}.link`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/50 transition-colors"
                data-ocid="nav.user.dropdown_menu"
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs bg-gold/20 text-gold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-semibold text-foreground">
                    {profile?.name ?? profile?.userId ?? "User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {userRole ? ROLE_LABELS[userRole] : ""}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-popover border-border w-44"
            >
              <div className="px-2 py-1.5 border-b border-border mb-1">
                <p className="text-xs font-semibold text-foreground">
                  {profile?.userId}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {userRole ? ROLE_LABELS[userRole] : ""}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="text-xs text-destructive hover:bg-muted cursor-pointer"
                onClick={handleLogout}
                data-ocid="nav.logout.button"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-14 bottom-0 z-40 w-56 flex flex-col border-r transition-transform duration-200",
            "md:translate-x-0",
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0",
          )}
          style={{ background: "#0D192B", borderColor: "#26364A" }}
        >
          {/* Mobile nav */}
          <nav
            className="md:hidden flex flex-col gap-0.5 px-2 pt-3 pb-2 border-b shrink-0"
            style={{ borderColor: "#26364A" }}
          >
            {NAV_ITEMS.filter((item) => !item.adminOnly || adminUser).map(
              (item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className="px-3 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  activeProps={{
                    className: "bg-gold/10 text-gold border border-gold/20",
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          {/* District filter — dropdown */}
          <div className="flex flex-col flex-1 min-h-0 py-3 px-3">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase px-1 mb-2 shrink-0">
              DISTRICT FILTER
            </p>
            <Select
              value={selectedDistrict ?? "all"}
              onValueChange={(v) => {
                onDistrictChange?.(v === "all" ? null : v);
                setSidebarOpen(false);
              }}
            >
              <SelectTrigger
                className="w-full bg-muted/40 border-border text-foreground text-xs h-9"
                data-ocid="sidebar.district.select"
              >
                <MapPin className="w-3 h-3 mr-1.5 text-muted-foreground flex-shrink-0" />
                <SelectValue placeholder="All Districts" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-72 overflow-y-auto">
                <SelectItem
                  value="all"
                  className="text-foreground text-xs font-semibold"
                >
                  All Districts
                </SelectItem>
                {allDistricts.map((d) => (
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
            {selectedDistrict && (
              <button
                type="button"
                onClick={() => onDistrictChange?.(null)}
                className="mt-2 text-[10px] text-gold hover:text-gold/80 transition-colors text-left px-1"
                data-ocid="sidebar.clear_district.button"
              >
                ✕ Clear filter
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 md:ml-56 min-w-0">
          <div className={cn("flex gap-0", showRightPanel ? "xl:mr-80" : "")}>
            <div className="flex-1 min-w-0 p-4 md:p-6">{children}</div>
          </div>
        </main>

        {/* Right panel */}
        {showRightPanel && (
          <aside
            className="hidden xl:flex fixed right-0 top-14 bottom-0 w-80 flex-col gap-3 p-4 overflow-y-auto border-l"
            style={{ background: "#0D192B", borderColor: "#26364A" }}
          >
            <div className="bg-card rounded-lg border border-border p-3">
              <p className="text-xs font-bold text-gold uppercase tracking-widest mb-3">
                Quick Actions
              </p>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={onAddLead}
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors w-full text-left"
                  data-ocid="quick.add_lead.button"
                >
                  <span className="w-8 h-8 rounded bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-4 h-4 text-gold" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Add New Customer Lead
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Create a new solar inquiry
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={onScheduleSurvey}
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors w-full text-left"
                  data-ocid="quick.schedule_survey.button"
                >
                  <span className="w-8 h-8 rounded bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                    <CalendarCheck className="w-4 h-4 text-blue-300" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Schedule Survey
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Mark survey scheduled
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={onAssignLeads}
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors w-full text-left"
                  data-ocid="quick.assign_leads.button"
                >
                  <span className="w-8 h-8 rounded bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-4 h-4 text-emerald-300" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Assign Leads
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Assign to sales persons
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {adminUser && (
              <div className="bg-card rounded-lg border border-border p-3">
                <p className="text-xs font-bold text-gold uppercase tracking-widest mb-3">
                  Admin Controls
                </p>
                <div className="flex flex-col gap-1.5">
                  <Link
                    to="/users"
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                    data-ocid="admin.manage_users.link"
                  >
                    <span className="w-8 h-8 rounded bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-purple-300" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Manage Users
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Create & manage staff
                      </p>
                    </div>
                  </Link>
                  <Link
                    to="/assignments"
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                    data-ocid="admin.assignments.link"
                  >
                    <span className="w-8 h-8 rounded bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-amber-300" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Assignments
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Assign leads to team
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                © {new Date().getFullYear()} Shree Adishakti Solar Pvt Ltd
              </p>
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                Built with ❤️ using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  caffeine.ai
                </a>
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
}
