'use client';
import { usePathname } from 'next/navigation';

// The shop's header, footer, bag and announcement bar are hidden on all dashboard portals (owner, admin, manager).
const DASHBOARD_PREFIXES = ['/admin', '/owner', '/manager'];

export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (!path) return <>{children}</>;
  const isDashboard = DASHBOARD_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  return isDashboard ? null : <>{children}</>;
}
