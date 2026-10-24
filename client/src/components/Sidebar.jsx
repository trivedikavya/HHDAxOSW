import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, FolderSearch, Bug, FileText, Info, ShieldCheck, ArrowLeft } from "lucide-react";

const NAV_ITEMS = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/scan", label: "Scan Repository", icon: FolderSearch },
  { to: "/app/findings", label: "Findings", icon: Bug },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { to: "/app/about", label: "About", icon: Info },
];

export function Sidebar({ className = "" }) {
  return (
    <nav
      className={`flex h-full w-60 shrink-0 flex-col justify-between border-r border-border bg-sidebar px-3 py-4 ${className}`}
      aria-label="Primary navigation"
    >
      <div>
        <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-raised/60">
          <ShieldCheck className="text-accent" size={22} aria-hidden="true" />
          <span className="text-base font-semibold tracking-tight text-ink">
            RepoMedic AI
          </span>
        </Link>

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

      <div className="flex flex-col gap-2">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-raised/60 hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to site
        </Link>
        <div className="px-3 py-2 font-mono text-xs text-ink-faint">v0.3.0 · Phase 3</div>
      </div>
    </nav>
  );
}
