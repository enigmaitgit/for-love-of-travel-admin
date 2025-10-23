'use client';

import { toast } from 'sonner';

export interface SnackbarOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export function useSnackbar() {
  const showSnackbar = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration?: number) => {
    switch (type) {
      case 'success':
        toast.success(message, { duration });
        break;
      case 'error':
        toast.error(message, { duration });
        break;
      case 'warning':
        toast.warning(message, { duration });
        break;
      case 'info':
      default:
        toast.info(message, { duration });
        break;
    }
  };

  return {
    showSnackbar,
  };
}
