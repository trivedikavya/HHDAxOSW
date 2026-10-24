const CATEGORY_LABELS = {
  documentation: "Documentation",
  testing: "Testing",
  configuration: "Configuration",
  "security-hygiene": "Security hygiene",
  consistency: "Consistency",
  "project-metadata": "Project metadata",
};

export function CategoryBadge({ category }) {
  const label = CATEGORY_LABELS[category] ?? category;
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-raised px-2.5 py-1 text-xs font-medium text-ink-soft">
      {label}
    </span>
  );
}
