import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Folder,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Users,
  ScrollText,
  ClipboardList,
  Bell,
  FolderOpen,
} from "lucide-react";
import { useState, useMemo } from "react";

// NAVIGATION STRUCTURE - Berdasarkan Role dan Flow
const navigation = [
  // REPORTER ROLE - Fokus pada pelaporan
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["reporter", "first_responder", "investigator", "manager", "admin"],
    description: "Overview & statistics"
  },
  {
    name: "Report Incident",
    href: "/report",
    icon: FileText,
    roles: ["reporter", "first_responder", "investigator", "manager", "admin"],
    description: "Create new incident report"
  },
  {
    name: "My Reports",
    href: "/my-reports",
    icon: ClipboardList,
    roles: ["reporter"],
    description: "View your submitted reports",
    badge: "my-reports-count"
  },

  // FIRST RESPONDER ROLE - Fokus pada triage & assignment
  {
    name: "Triage Queue",
    href: "/triage",
    icon: Bell,
    roles: ["first_responder"],
    description: "New incidents awaiting triage",
    badge: "triage-count"
  },
  {
    name: "Active Incidents",
    href: "/incidents/active",
    icon: FolderOpen,
    roles: ["first_responder", "investigator", "manager"],
    description: "Currently active incidents",
    badge: "active-count"
  },

  // INVESTIGATOR ROLE - Fokus pada investigation & forensics
  {
    name: "My Cases",
    href: "/my-cases",
    icon: Folder,
    roles: ["investigator"],
    description: "Cases assigned to you",
    badge: "my-cases-count"
  },
  {
    name: "Forensic Tools",
    href: "/tools",
    icon: Wrench,
    roles: ["investigator", "manager", "admin"],
    description: "Evidence analysis tools"
  },

  // MANAGER ROLE - Fokus pada oversight & compliance
  {
    name: "All Incidents",
    href: "/incidents",
    icon: Folder,
    roles: ["manager", "admin"],
    description: "View all incidents"
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["manager", "admin"],
    description: "Reports & metrics"
  },
  {
    name: "Audit Logs",
    href: "/audit-logs",
    icon: ScrollText,
    roles: ["manager", "admin"],
    description: "System activity logs"
  },

  // ADMIN ROLE - Fokus pada system management
  {
    name: "Users",
    href: "/users",
    icon: Users,
    roles: ["admin"],
    description: "Manage users & permissions"
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
    description: "System configuration"
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { incidents } = useData();

  // Calculate dynamic badge counts
  const badgeCounts = useMemo(() => {
    if (!incidents || !user) return {};

    return {
      'triage-count': incidents.filter(i => i.status === 'new').length,
      'active-count': incidents.filter(i => !['closed', 'resolved'].includes(i.status)).length,
      'my-cases-count': incidents.filter(i => i.assigned_to?.id === user.id).length,
      'my-reports-count': incidents.filter(i => i.reporter?.id === user.id).length,
    };
  }, [incidents, user]);

  // Filter navigation based on user role
  const filteredNav = navigation.filter(
    (item) => user && item.roles.includes(user.role)
  );

  // Get role-specific greeting
  const getRoleGreeting = () => {
    switch (user?.role) {
      case "reporter":
        return "Report & Track";
      case "first_responder":
        return "Triage & Respond";
      case "investigator":
        return "Investigate & Analyze";
      case "manager":
        return "Manage & Oversee";
      case "admin":
        return "System Admin";
      default:
        return "DFIR Manager";
    }
  };

  // Get badge count for item
  const getBadgeCount = (badgeType?: string) => {
    if (!badgeType) return null;
    const count = badgeCounts[badgeType as keyof typeof badgeCounts];
    return count > 0 ? count : null;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
        {!collapsed && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              <span className="text-lg font-bold text-gradient">DFIR Manager</span>
            </div>
            <span className="text-xs text-muted-foreground ml-9">
              {getRoleGreeting()}
            </span>
          </div>
        )}

        {collapsed && <Shield className="h-8 w-8 text-primary mx-auto" />}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNav.map((item) => {
          const badgeCount = getBadgeCount(item.badge);
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-all group relative",
                collapsed && "justify-center"
              )}
              activeClassName="bg-primary/10 text-primary font-semibold"
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              
              {!collapsed ? (
                <>
                  <span className="font-medium flex-1">{item.name}</span>
                  
                  {/* Dynamic Badge */}
                  {badgeCount && (
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full",
                      item.badge === 'triage-count' 
                        ? "bg-red-500 text-white" 
                        : "bg-primary text-primary-foreground"
                    )}>
                      {badgeCount}
                    </span>
                  )}
                </>
              ) : (
                <>
                  {/* Tooltip for collapsed state */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                    {badgeCount && ` (${badgeCount})`}
                  </div>
                  
                  {/* Badge indicator on icon */}
                  {badgeCount && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      {user && (
        <div className="border-t border-sidebar-border p-4 flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold text-sm">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role.replace("_", " ")}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto relative">
              <span className="text-primary font-semibold text-sm">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}