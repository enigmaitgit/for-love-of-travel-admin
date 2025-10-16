'use client';

import { Layout1 } from '@/components/layouts/layout-1';
import { ReactNode } from 'react';
import { SnackbarProvider } from '@/components/ui/snackbar';

export default function Layout({children}: {children: ReactNode}) {
  return (
    <SnackbarProvider>
      <Layout1>
        {children}
      </Layout1>
    </SnackbarProvider>
  );
}
