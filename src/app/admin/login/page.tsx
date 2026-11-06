import { redirect } from 'next/navigation';
import { adminConfig, getAdmin } from '@/lib/admin-auth';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';
export default async function AdminLogin() {
  if (await getAdmin()) redirect('/admin');
  const c = adminConfig();
  return (
    <div className="grid min-h-screen place-items-center bg-cream/40 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-charcoal/10 bg-surface p-8 shadow-xl shadow-shade/10">
        <p className="text-xs uppercase tracking-[.2em] text-gold-ink">AurNya</p>
        <h1 className="mb-6 mt-1 font-serif text-4xl">Admin sign in</h1>
        {c.config ? <LoginForm /> : <p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">{c.reason}</p>}
      </div>
    </div>
  );
}
