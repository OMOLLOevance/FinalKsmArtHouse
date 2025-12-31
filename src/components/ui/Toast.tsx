// src/components/ui/Toast.tsx
// Adapter file to bridge the existing API with the new Radix/shadcn implementation

import { useToast as useShadcnToast } from "@/hooks/use-toast";
import React from "react";

// Export the ToastProvider component as a wrapper for children
// In Shadcn, we usually put <Toaster /> in the root layout, and don't need a provider wrapper for children.
// However, to keep compatibility with existing ClientLayout structure:
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Export the hook with the legacy API (showSuccess, showError)
export const useToast = () => {
  const { toast } = useShadcnToast();

  const showSuccess = (title: string, message: string) => {
    toast({
      title: title,
      description: message,
      variant: "success", // Defined in our custom variants
    });
  };

  const showError = (title: string, message: string) => {
    toast({
      title: title,
      description: message,
      variant: "destructive",
    });
  };

  return { showSuccess, showError };
};
