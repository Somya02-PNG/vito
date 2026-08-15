'use client';

import React from 'react';
import RoleAppShell from './RoleAppShell';
import { RoleType } from './RoleNavConfig';

interface AppShellProps {
  children: React.ReactNode;
  role?: RoleType;
}

export default function AppShell({ children, role = 'customer' }: AppShellProps) {
  return <RoleAppShell role={role}>{children}</RoleAppShell>;
}
