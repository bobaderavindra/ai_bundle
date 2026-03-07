import { useEffect, useRef, useState } from "react";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";

interface HeaderBarProps {
  isGridLocked: boolean;
  onToggleGridLock: () => void;
  activeDashboard: "classic" | "life";
  onSwitchDashboard: (dashboard: "classic" | "life") => void;
}

export default function HeaderBar({
  isGridLocked,
  onToggleGridLock,
  activeDashboard,
  onSwitchDashboard
}: HeaderBarProps) {
  const { theme, setTheme } = useTheme();
  const { auth, logout } = useAuth();
  const avatarLabel = auth?.email?.trim().charAt(0).toUpperCase() || "U";
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!themeMenuRef.current?.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsThemeMenuOpen(false);
    }

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const themeOptions: Array<{ id: "ocean" | "sand" | "slate"; label: string }> = [
    { id: "ocean", label: "Ocean" },
    { id: "sand", label: "Sand" },
    { id: "slate", label: "Slate" }
  ];

  return (
    <header className="dashboard-menu" aria-label="Dashboard menu">
      <div className="dashboard-menu-right">
        <a className="dashboard-menu-link" href="#">
          Gmail
        </a>
        <a className="dashboard-menu-link" href="#">
          Images
        </a>
        <button type="button" className="dashboard-icon-btn" aria-label="Labs">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 3v2l.04.02L10 6.2V10.2l-4.63 8.35A1 1 0 0 0 6.24 20h11.52a1 1 0 0 0 .87-1.45L14 10.2v-4l.96-1.18L15 5V3H9zM12 11.92 15.9 19H8.1L12 11.92z" />
          </svg>
        </button>
        <button type="button" className="dashboard-icon-btn" aria-label="Google apps">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="5" cy="5" r="1.5" />
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="19" cy="5" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
            <circle cx="5" cy="19" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
            <circle cx="19" cy="19" r="1.5" />
          </svg>
        </button>
        <div className="dashboard-view-switch" role="tablist" aria-label="Dashboard view selector">
          <button
            type="button"
            role="tab"
            className={`dashboard-view-btn${activeDashboard === "classic" ? " is-active" : ""}`}
            aria-selected={activeDashboard === "classic"}
            onClick={() => onSwitchDashboard("classic")}
          >
            Classic
          </button>
          <button
            type="button"
            role="tab"
            className={`dashboard-view-btn${activeDashboard === "life" ? " is-active" : ""}`}
            aria-selected={activeDashboard === "life"}
            onClick={() => onSwitchDashboard("life")}
          >
            Life App
          </button>
        </div>
        <div className="dashboard-theme-wrap" ref={themeMenuRef}>
          <button
            type="button"
            className="dashboard-theme-trigger"
            aria-haspopup="menu"
            aria-expanded={isThemeMenuOpen}
            onClick={() => setIsThemeMenuOpen((prev) => !prev)}
          >
            Theme
          </button>
          {isThemeMenuOpen && (
            <div className="dashboard-theme-dropdown" role="menu" aria-label="Theme menu">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={theme === option.id}
                  title={option.label}
                  className={`theme-dot theme-dot-${option.id}${theme === option.id ? " is-active" : ""}`}
                  onClick={() => {
                    setTheme(option.id);
                    setIsThemeMenuOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        {activeDashboard === "classic" && (
          <button type="button" className="dashboard-lock-btn" onClick={onToggleGridLock}>
            {isGridLocked ? "Unlock Layout" : "Lock Layout"}
          </button>
        )}
        {auth && (
          <button
            type="button"
            className="dashboard-avatar-btn"
            onClick={logout}
            title={`${auth.email} (${auth.role}) - Click to logout`}
            aria-label={`Profile for ${auth.email}. Click to logout`}
          >
            {avatarLabel}
          </button>
        )}
      </div>
    </header>
  );
}
