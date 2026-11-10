import type { Metadata } from 'next';

// Never shown in search results (robots.txt also blocks /admin).
export const metadata: Metadata = { title: { default: 'Admin', template: '%s | AurNya admin' }, robots: { index: false, follow: false } };
export default function AdminRoot({ children }: { children: React.ReactNode }) { return <div data-admin>{children}</div>; }
