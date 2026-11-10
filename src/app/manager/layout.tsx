import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Manager Portal', template: '%s | AurNya Manager' },
  robots: { index: false, follow: false },
};
export default function ManagerRoot({ children }: { children: React.ReactNode }) {
  return <div data-manager>{children}</div>;
}
