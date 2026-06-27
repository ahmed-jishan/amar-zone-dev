'use client'

import TabErrorBoundary from '@/components/shared/TabErrorBoundary'
import { NamazPage } from '@/features/namaz';

export default function Page() {
  return (
    <TabErrorBoundary fallbackTitle="Namaz tab crashed">
      <NamazPage />
    </TabErrorBoundary>
  );
}
