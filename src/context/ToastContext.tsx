import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastAction } from '../components/Toast';

type ToastOptions = {
  duration?: number;
  action?: ToastAction;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastProviderProps = {
  children: ReactNode;
};

type ToastState = {
  message: string;
  visible: boolean;
  duration: number;
  action?: ToastAction;
};

/**
 * Toast provider that wraps the app and provides global toast functionality.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    visible: false,
    duration: 2500,
    action: undefined,
  });

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    setToast({
      message,
      visible: true,
      duration: options?.duration ?? 2500,
      action: options?.action,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={toast.message}
        visible={toast.visible}
        onDismiss={hideToast}
        duration={toast.duration}
        action={toast.action}
      />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functionality.
 * Must be used within a ToastProvider.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
