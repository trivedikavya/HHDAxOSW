const VARIANT_CLASSES = {
  primary:
    "bg-accent text-base hover:bg-accent/90 disabled:bg-accent/40 disabled:text-base/70",
  secondary:
    "bg-raised text-ink border border-border hover:bg-raised/70 disabled:opacity-50",
  ghost:
    "bg-transparent text-ink-soft hover:text-ink hover:bg-raised disabled:opacity-50",
  danger:
    "bg-transparent text-danger border border-danger/40 hover:bg-danger/10 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
