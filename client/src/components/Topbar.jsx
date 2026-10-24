import { useNavigate, useLocation } from "react-router-dom";
import { FolderSearch, Menu } from "lucide-react";
import { Button } from "./Button.jsx";

export function Topbar({ title, description, onOpenMenu, statusSlot }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hidePrimaryAction = location.pathname === "/app/scan";

  return (
    <header className="flex flex-col gap-3 border-b border-border bg-base px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-lg p-2 text-ink-soft hover:bg-raised hover:text-ink lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink">
              {title}
            </h1>
            {statusSlot}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-ink-soft">{description}</p>
          ) : null}
        </div>
      </div>

      {!hidePrimaryAction && (
        <Button onClick={() => navigate("/app/scan")}>
          <FolderSearch size={16} aria-hidden="true" />
          Scan Repository
        </Button>
      )}
    </header>
  );
}
