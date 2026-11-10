import { Card, PageHeader, td, th } from '@/components/admin/ui';
import { getDb } from '@/db/client';
import { outboxStats } from '@/db/whatsapp';
import { requireRole } from '@/lib/role-auth';
import { defaultCountryCode, readWhatsappConfig } from '@/lib/whatsapp-config';

export const metadata = { title: 'WhatsApp Updates' };
export const dynamic = 'force-dynamic';

const when = (d: Date) => d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const mask = (p: string) => `+${p.slice(0, 2)}•••••${p.slice(-3)}`;
const tone: Record<string, string> = { sent: 'text-[#4ADE80]', failed: 'text-red-400', queued: 'text-[#E5B558]', sending: 'text-[#E5B558]', skipped: 'text-[#8E869B]' };

export default async function WhatsappPage() {
  await requireRole('owner');
  const cfg = readWhatsappConfig();
  let stats: Awaited<ReturnType<typeof outboxStats>> | null = null;
  try { stats = await outboxStats(getDb(), defaultCountryCode()); } catch { /* shown below */ }
  return (
    <div className="space-y-6">
      <PageHeader title="WhatsApp Updates" sub="Customers who sign in with a mobile number get order updates, sale alerts and exclusive offers on WhatsApp. Everything is controlled from your environment file." />
      <Card title="Status">
        {cfg.ok ? (
          <p className="text-xs text-[#4ADE80]">● Switched on · provider: {cfg.config.provider === 'meta' ? 'Meta WhatsApp Cloud API' : 'Twilio'}{cfg.config.provider === 'meta' ? ` · mode: ${cfg.config.mode}` : ''}</p>
        ) : (
          <div className="text-xs text-[#E5B558] space-y-2">
            <p>● {cfg.reason}</p>
            <p className="text-[#8E869B]">Customers are still subscribed when they sign in; messages start flowing as soon as the keys are added and the site is redeployed. See README_PHASE_7_WHATSAPP_AND_APPROVALS.md.</p>
          </div>
        )}
      </Card>
      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[['Subscribed customers', stats.subscribers], ['Sent (7 days)', stats.counts.sent ?? 0], ['Waiting', (stats.counts.queued ?? 0) + (stats.counts.sending ?? 0)], ['Failed', stats.counts.failed ?? 0], ['Skipped', stats.counts.skipped ?? 0]].map(([l, v]) => (
              <div key={String(l)} className="rounded-2xl border border-white/5 bg-[#181521] p-4"><p className="text-[10px] uppercase font-semibold text-[#8E869B]">{l}</p><p className="mt-1 font-serif text-2xl font-bold text-white">{v}</p></div>
            ))}
          </div>
          <Card title="Latest messages" className="!p-0">
            {stats.recent.length === 0 ? <p className="p-5 text-xs text-[#8E869B]">Nothing has been queued yet. The first message appears when a customer with a phone number signs in.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-xs">
                <thead><tr><th className={th}>When (IST)</th><th className={th}>To</th><th className={th}>Type</th><th className={th}>Status</th><th className={th}>Detail</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {stats.recent.map((m) => (
                    <tr key={m.id}><td className={`${td} whitespace-nowrap text-[#736B7F]`}>{when(m.createdAt)}</td><td className={td}>{mask(m.phone)}</td><td className={td}>{m.kind}</td>
                      <td className={`${td} font-semibold ${tone[m.status] ?? ''}`}>{m.status}</td><td className={`${td} text-[#8E869B]`}>{m.error ?? ''}</td></tr>
                  ))}
                </tbody></table></div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
