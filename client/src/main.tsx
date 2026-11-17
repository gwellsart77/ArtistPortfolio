import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AppErrorBoundary, reloadForNewVersion } from "@/components/app-error-boundary";

// A new version was published while this tab was open and a page file it needs is gone:
// reload once to get the new version instead of showing a blank page.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewVersion()) event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
