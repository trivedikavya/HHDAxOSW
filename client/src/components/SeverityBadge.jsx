import { AlertOctagon, AlertTriangle, AlertCircle, Info, CircleDot } from "lucide-react";

/**
 * Severity is always communicated with both an icon and a label, never
 * color alone, so the badge remains meaningful without relying on color
 * perception.
 */
const SEVERITY_CONFIG = {
  critical: { label: "Critical", icon: AlertOctagon, className: "text-danger bg-danger/10 border-danger/30" },
  high: { label: "High", icon: AlertTriangle, className: "text-danger bg-danger/10 border-danger/30" },
  medium: { label: "Medium", icon: AlertCircle, className: "text-warning bg-warning/10 border-warning/30" },
  low: { label: "Low", icon: CircleDot, className: "text-accent-2 bg-accent-2/10 border-accent-2/30" },
  info: { label: "Info", icon: Info, className: "text-ink-soft bg-ink-soft/10 border-ink-soft/30" },
};

export function SeverityBadge({ severity }) {
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon size={13} aria-hidden="true" />
      {config.label}
    </span>
  );
}
