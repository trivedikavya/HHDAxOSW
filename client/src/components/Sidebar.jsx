import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderSearch, Bug, FileText, Info, ShieldCheck } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/scan", label: "Scan Repository", icon: FolderSearch },
  { to: "/findings", label: "Findings", icon: Bug },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/about", label: "About", icon: Info },
];

export function Sidebar({ className = "" }) {
  return (
    <nav
      className={`flex h-full w-60 shrink-0 flex-col justify-between border-r border-border bg-sidebar px-3 py-4 ${className}`}
      aria-label="Primary navigation"
    >
      <div>
        <div className="flex items-center gap-2 px-3 py-2">
          <ShieldCheck className="text-accent" size={22} aria-hidden="true" />
          <span className="text-base font-semibold tracking-tight text-ink">
            RepoMedic AI
          </span>
        </div>

        <ul className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-raised text-ink"
                      : "text-ink-soft hover:bg-raised/60 hover:text-ink"
                  }`
                }
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-3 py-2 font-mono text-xs text-ink-faint">v0.1.0 · Phase 1</div>
    </nav>
  );
}
