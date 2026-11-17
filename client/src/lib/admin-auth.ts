/**
 * Sign the admin out for real: ends the server session (cookie) as well as the
 * browser-side flag. Before this existed, "Logout" only cleared the flag and the
 * server session stayed signed in for up to 7 days.
 */
export async function adminLogout(): Promise<void> {
  try {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
  } catch {
    // Even if the network call fails, clear the local flag below
  }
  sessionStorage.removeItem("admin_authenticated");
}
