'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface ErrorContextType {
  showError: (
    message: string,
    action?: { label: string; onClick: () => void }
  ) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const showError = (
    message: string,
    action?: { label: string; onClick: () => void }
  ) => {
    toast.error(message, {
      duration: 5000,
    });
    // Note: action is not supported in react-hot-toast
  };

  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showInfo = (message: string) => {
    toast(message);
  };

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, showInfo }}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </ErrorContext.Provider>
  );
};
