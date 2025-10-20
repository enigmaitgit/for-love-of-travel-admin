'use client';

import * as React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Snackbar({ 
  open, 
  onClose, 
  message, 
  type = 'info', 
  duration = 5000,
  action 
}: SnackbarProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  }, [onClose]);

  React.useEffect(() => {
    if (open) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [open, duration, handleClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: 'text-green-600',
          button: 'text-green-600 hover:text-green-800'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
          button: 'text-red-600 hover:text-red-800'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
          button: 'text-yellow-600 hover:text-yellow-800'
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          button: 'text-blue-600 hover:text-blue-800'
        };
    }
  };

  const styles = getStyles();

  if (!open) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div
        className={cn(
          'flex items-center gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300',
          styles.container,
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        )}
      >
        <div className={cn('flex-shrink-0', styles.icon)}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'text-sm font-medium px-3 py-1 rounded-md hover:bg-black/5 transition-colors',
                styles.button
              )}
            >
              {action.label}
            </button>
          )}
          
          <button
            onClick={handleClose}
            className={cn(
              'flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors',
              styles.button
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Snackbar context for global state management
interface SnackbarContextType {
  showSnackbar: (message: string, type?: 'success' | 'error' | 'warning' | 'info', action?: { label: string; onClick: () => void }) => void;
}

const SnackbarContext = React.createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    action?: { label: string; onClick: () => void };
  }>({
    open: false,
    message: '',
    type: 'info'
  });

  const showSnackbar = React.useCallback((
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    action?: { label: string; onClick: () => void }
  ) => {
    setSnackbar({
      open: true,
      message,
      type,
      action
    });
  }, []);

  const handleClose = React.useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={snackbar.open}
        onClose={handleClose}
        message={snackbar.message}
        type={snackbar.type}
        action={snackbar.action}
      />
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = React.useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}



