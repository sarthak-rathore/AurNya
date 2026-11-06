'use client';
import { usePathname } from 'next/navigation';

// The shop's header, footer, bag and announcement bar are not shown inside the admin dashboard, which has its own screen layout.
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path === '/admin' || path.startsWith('/admin/') ? null : <>{children}</>;
}
