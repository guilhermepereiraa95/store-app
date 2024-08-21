'use client';
import React from 'react';
import { UserProvider } from '../contexts/UserContext';
import { Layout } from './Layout';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <Layout>
        {children}
      </Layout>
    </UserProvider>
  );
}
