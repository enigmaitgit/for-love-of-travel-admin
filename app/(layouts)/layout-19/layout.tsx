'use client';

import { Layout19 } from '@/components/layouts/layout-19/index';
import { ReactNode } from 'react';

export default function Layout({children}: {children: ReactNode}) {
  return (
    <Layout19>
      {children}
    </Layout19>
  );
}
