import React from 'react';
import { Layout } from '@/components/Layout/Layout';

interface PageLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  className?: string;
}

export function PageLayout({ children, hideHeader = true, className = '' }: PageLayoutProps) {
  return (
    <Layout hideHeader={hideHeader}>
      <div className={`min-h-screen ${className}`}>
        <div className="w-full space-y-6 pb-8">
          {children}
        </div>
      </div>
    </Layout>
  );
}
