import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Owner Portal', template: '%s | AurNya Owner' },
  robots: { index: false, follow: false },
};
export default function OwnerRoot({ children }: { children: React.ReactNode }) {
  return <div data-owner>{children}</div>;
}
