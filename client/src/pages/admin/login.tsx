import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import MfaForm from "@/components/MfaForm";

export default function AdminLogin() {
  const [requireMfa, setRequireMfa] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<{username: string, password: string} | null>(null);

  const handleRequireMfa = (credentials: { username: string; password: string }) => {
    setSavedCredentials(credentials);
    setRequireMfa(true);
  };

  const handleBackToLogin = () => {
    setRequireMfa(false);
    setSavedCredentials(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {!requireMfa ? (
        <LoginForm key="login-form" onRequireMfa={handleRequireMfa} />
      ) : (
        <MfaForm 
          key="mfa-form" 
          savedCredentials={savedCredentials!} 
          onBack={handleBackToLogin} 
        />
      )}
    </div>
  );
}