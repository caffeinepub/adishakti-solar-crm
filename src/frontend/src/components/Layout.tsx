import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart2,
  Bell,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllDistricts,
  useCallerProfile,
  useIsAdmin,
} from "../hooks/useQueries";
import { DEFAULT_DISTRICTS, ROLE_LABELS } from "../types";

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
  const { clear } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: districts = [] } = useAllDistricts();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const allDistricts = districts.length > 0 ? districts : DEFAULT_DISTRICTS;

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleLogout = () => {
    clear();
    navigate({ to: "/" });
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
            onKeyDown={(e) => e.key === "Enter" && setSidebarOpen((v) => !v)}
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
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
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
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground p-1.5 rounded"
            data-ocid="nav.bell.button"
          >
            <Bell className="w-4 h-4" />
          </button>
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
                    {profile?.name ?? "User"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {profile ? ROLE_LABELS[profile.role] : ""}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-popover border-border w-44"
            >
              <DropdownMenuItem
                className="text-xs text-foreground hover:bg-muted"
                data-ocid="nav.settings.button"
              >
                <Settings className="w-3.5 h-3.5 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="text-xs text-destructive hover:bg-muted"
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
          <ScrollArea className="flex-1 py-3">
            {/* Mobile nav */}
            <nav className="md:hidden flex flex-col gap-0.5 px-2 mb-4">
              {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
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

            {/* District filter */}
            <div className="px-3">
              <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-2 px-1">
                DISTRICT
              </p>
              <button
                type="button"
                onClick={() => onDistrictChange?.(null)}
                onKeyDown={(e) => e.key === "Enter" && onDistrictChange?.(null)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors mb-0.5",
                  !selectedDistrict
                    ? "bg-gold/10 text-gold font-semibold border border-gold/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                )}
                data-ocid="sidebar.all_districts.button"
              >
                <MapPin className="w-3 h-3" /> All Districts
              </button>
              {allDistricts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDistrictChange?.(d)}
                  onKeyDown={(e) => e.key === "Enter" && onDistrictChange?.(d)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors mb-0.5",
                    selectedDistrict === d
                      ? "bg-gold/10 text-gold font-semibold border border-gold/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  )}
                  data-ocid="sidebar.district.button"
                >
                  <MapPin className="w-3 h-3" /> {d}
                </button>
              ))}
            </div>
          </ScrollArea>
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
            {/* Quick Actions */}
            <div className="bg-card rounded-lg border border-border p-3">
              <p className="text-xs font-bold text-gold uppercase tracking-widest mb-3">
                Quick Actions
              </p>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={onAddLead}
                  onKeyDown={(e) => e.key === "Enter" && onAddLead?.()}
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
                  onKeyDown={(e) => e.key === "Enter" && onScheduleSurvey?.()}
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
                  onKeyDown={(e) => e.key === "Enter" && onAssignLeads?.()}
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

            {/* Admin Controls */}
            {isAdmin && (
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
                        Approve & manage staff
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
                        District Settings
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Manage district leads
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
