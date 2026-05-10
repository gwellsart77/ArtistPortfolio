// Smart navigation utility for admin pages - Updated to use canonical dashboard URL
export const navigateBackToDashboard = (navigate: (path: string) => void) => {
  // Always navigate to the canonical dashboard URL
  navigate("/admin/dashboard");
};