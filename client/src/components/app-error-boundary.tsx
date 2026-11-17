import React from "react";

/**
 * Last line of defence so a visitor (or Gabe in the admin) never sees a blank white page.
 *
 * The most common cause of a blank page: a new version was published while a tab was
 * open, and that tab asks for a page file that no longer exists. In that case we reload
 * once to pick up the new version. Anything else shows a short message with a Reload button.
 */

const RELOAD_KEY = "app-reloaded-for-update-at";

export function isStaleVersionError(error: unknown): boolean {
  const msg = String((error as Error)?.message || error || "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading chunk \S+ failed/i.test(msg);
}

/** Reload at most once every 30 seconds, so a real outage can't cause a reload loop. */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // storage blocked: still reload once
  }
  window.location.reload();
  return true;
}

interface State {
  error: unknown;
}

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error("App error:", error);
    if (isStaleVersionError(error)) {
      reloadForNewVersion();
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3] px-6 text-center">
        <div>
          <p className="font-serif text-3xl text-[#1b1a18]">Something didn't load</p>
          <p className="mt-2 text-sm text-[#6e6a63]">The site may have just been updated. Reloading usually fixes it.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 h-11 px-8 bg-[#1b1a18] hover:bg-black text-white text-xs uppercase tracking-[0.16em]"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
