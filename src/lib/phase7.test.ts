import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { claimChange, createChange, finishChange, listChanges, reopenFailed } from '../db/approvals';
import { backends, openTestDb } from '../db/test-db';
import { claimBatch, enqueue, isSubscribed, listSubscribers, optInOnLogin, recordOutcome, setSubscription, setSubscriptionByPhone } from '../db/whatsapp';
import { memoryExtra, memoryStore } from '../db/memory-store';
import { users } from '../db/schema';
import { listCustomers } from '../db/admin-customers';
import { signAdminToken, readAdminConfig } from './admin-auth-core';
import { describeChange, isMutatingMethod } from './approvals-describe';
import { readRoleConfig, signRoleToken, ROLE_COOKIE } from './role-auth-core';
import { sectionBodySchema } from './sections';
import { adminMayOpen, managerMayCall, managerMayOpen, resolveStaff, verifyStaffToken } from './staff-session';
import { readWhatsappConfig } from './whatsapp-config';
import { composeOffer, composeOrder, composeWelcome, couponHeadline } from './whatsapp-messages';
import { normalizePhone } from './whatsapp-phone';
import { sendWhatsapp } from './whatsapp-provider';

const env = {
  OWNER_EMAIL: 'owner@aurnya.com', OWNER_PASSWORD: 'AurNya@Owner2026', ADMIN_EMAIL: 'admin@aurnya.com', ADMIN_PASSWORD: 'AurNya@Admin2026',
  MANAGER_EMAIL: 'manager@aurnya.com', MANAGER_PASSWORD: 'AurNya@Manager2026', ROLE_SESSION_SECRET: 'r'.repeat(32), ADMIN_SESSION_SECRET: 'a'.repeat(32), NODE_ENV: 'production',
};

describe('staff sign-in (the Admin → Orders bounce)', () => {
  test('an admin who signed in with the older admin token is recognised by role checks', () => {
    const legacy = readAdminConfig(env); assert.ok(legacy.ok);
    const token = signAdminToken(legacy.config);
    assert.deepEqual(verifyStaffToken('admin', token, env), { email: 'admin@aurnya.com', role: 'admin' });
  });
  test('the newer role token works too, and a token for one role never opens another', () => {
    const rc = readRoleConfig('admin', env); assert.ok(rc.ok);
    const t = signRoleToken(rc.config);
    assert.equal(verifyStaffToken('admin', t, env)?.role, 'admin');
    assert.equal(verifyStaffToken('owner', t, env), null);
    assert.equal(verifyStaffToken('manager', t, env), null);
    assert.equal(verifyStaffToken('admin', 'garbage', env), null);
    assert.equal(verifyStaffToken('admin', undefined, env), null);
  });
  test('highest role wins when several cookies exist', () => {
    const o = readRoleConfig('owner', env); const m = readRoleConfig('manager', env); assert.ok(o.ok && m.ok);
    const jar: Record<string, string> = { [ROLE_COOKIE.owner]: signRoleToken(o.config), [ROLE_COOKIE.manager]: signRoleToken(m.config) };
    assert.equal(resolveStaff((n) => jar[n], env)?.role, 'owner');
    delete jar[ROLE_COOKIE.owner];
    assert.equal(resolveStaff((n) => jar[n], env)?.role, 'manager');
  });
  test('manager page and API allow-lists', () => {
    assert.ok(managerMayOpen('/manager')); assert.ok(managerMayOpen('/manager/orders')); assert.ok(managerMayOpen('/manager/orders/abc'));
    assert.ok(managerMayOpen('/manager/approvals'));
    assert.ok(!managerMayOpen('/manager/customers'), 'the old check let every /manager/... page through');
    assert.ok(!managerMayOpen('/manager/settings')); assert.ok(!managerMayOpen('/manager/productsx'));
    assert.ok(managerMayCall('/api/admin/orders/123')); assert.ok(managerMayCall('/api/admin/inventory'));
    assert.ok(!managerMayCall('/api/admin/products')); assert.ok(!managerMayCall('/api/admin/coupons')); assert.ok(!managerMayCall('/api/admin/section/settings'));
    assert.ok(!adminMayOpen('/admin/users')); assert.ok(!adminMayOpen('/admin/whatsapp')); assert.ok(adminMayOpen('/admin/orders'));
  });
});

describe('describing a change for the owner', () => {
  test('known routes read as sentences', () => {
    assert.equal(describeChange('POST', '/api/admin/products', { name: 'Royal Ring', price: 4999 }).summary, 'Add product "Royal Ring" (₹4,999)');
    assert.equal(describeChange('DELETE', '/api/admin/products/12', null).summary, 'Delete product #12 permanently');
    assert.equal(describeChange('PATCH', '/api/admin/inventory', { productId: 3, mode: 'set', value: 7 }).section, 'Inventory');
    assert.match(describeChange('POST', '/api/admin/orders/123e4567-e89b-12d3-a456-426614174000', { action: 'status', to: 'shipped', courier: 'Delhivery' }).summary, /shipped.*Delhivery/);
    assert.match(describeChange('PUT', '/api/admin/section/settings', { value: { a: 1 } }).summary, /store settings/i);
    assert.match(describeChange('POST', '/api/admin/whatsapp/broadcast', { message: 'Sale!' }).summary, /Sale!/);
  });
  test('unknown routes are never invisible', () => {
    const d = describeChange('POST', '/api/admin/brand-new-thing', {}); assert.equal(d.section, 'General'); assert.match(d.summary, /brand-new-thing/);
  });
  test('only reads skip the approval gate', () => {
    assert.ok(!isMutatingMethod('GET')); assert.ok(!isMutatingMethod('head'));
    for (const m of ['POST', 'PUT', 'PATCH', 'DELETE']) assert.ok(isMutatingMethod(m));
  });
  test('section saves reject huge or empty payloads', () => {
    assert.ok(sectionBodySchema.safeParse({ value: [1, 2] }).success);
    assert.ok(!sectionBodySchema.safeParse({}).success);
    assert.ok(!sectionBodySchema.safeParse({ value: 'x'.repeat(300_000) }).success);
  });
});

describe('phone numbers', () => {
  test('whatever the customer typed becomes WhatsApp format', () => {
    for (const x of ['98765 43210', '+91 98765-43210', '09876543210', '919876543210', '0091 98765 43210']) assert.equal(normalizePhone(x), '919876543210', x);
    assert.equal(normalizePhone('+1 415 555 2671'), '14155552671');
  });
  test('garbage is rejected', () => {
    for (const x of ['', null, undefined, 'abc', '12345', '5876543210', '+91 12345']) assert.equal(normalizePhone(x as string), null, String(x));
  });
});

describe('WhatsApp settings come only from the environment', () => {
  test('off when nothing is set', () => { const r = readWhatsappConfig({}); assert.ok(!r.ok); });
  test('meta needs token and phone number id, and says what is missing', () => {
    const r = readWhatsappConfig({ WHATSAPP_TOKEN: 't' }); assert.ok(!r.ok && r.missing.includes('WHATSAPP_PHONE_NUMBER_ID'));
    const ok = readWhatsappConfig({ WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '123' }); assert.ok(ok.ok && ok.config.provider === 'meta' && ok.config.templates.offer === 'aurnya_offer');
  });
  test('twilio is detected from its keys', () => {
    const r = readWhatsappConfig({ TWILIO_ACCOUNT_SID: 'AC1', TWILIO_AUTH_TOKEN: 'x', TWILIO_WHATSAPP_FROM: 'whatsapp:+14155238886' });
    assert.ok(r.ok && r.config.provider === 'twilio' && r.config.twilioFrom === '+14155238886');
  });
});

describe('message wording', () => {
  test('welcome / order / offer', () => {
    assert.match(composeWelcome('AurNya', 'Priya Sharma', 'https://x/shop').text, /Hi Priya/);
    const o = composeOrder('AurNya', 'Priya', 42, 'shipped', { courier: 'Delhivery', trackingNumber: 'DL1', trackingUrl: 'https://t/DL1' });
    assert.deepEqual(o.params.slice(0, 2), ['Priya', '#42']); assert.match(o.text, /Delhivery/); assert.match(o.text, /https:\/\/t\/DL1/);
    const off = composeOffer('AurNya', null, '15% off', 'Use code FIRST15.', 'https://x/shop'); assert.equal(off.params[0], 'there');
  });
  test('template values never hold new lines (WhatsApp would refuse them)', () => {
    const c = composeOffer('AurNya', 'A', 'line1\nline2', 'a\n\nb', 'https://x'); for (const p of c.params) assert.ok(!/[\n\t]/.test(p));
  });
  test('coupon headline', () => {
    assert.deepEqual(couponHeadline({ code: 'FIRST15', kind: 'percent', value: 15, minSubtotalPaise: 99900 }), { headline: '15% off on orders above ₹999', details: 'Use code FIRST15 at checkout.' });
    assert.match(couponHeadline({ code: 'F', kind: 'fixed', value: 50000, minSubtotalPaise: 0 }).headline, /₹500 off/);
  });
});

describe('sending through the provider', () => {
  const meta = readWhatsappConfig({ WHATSAPP_TOKEN: 'tok', WHATSAPP_PHONE_NUMBER_ID: '999' }); const cfg = meta.ok ? meta.config : (null as never);
  const msg = { phone: '919876543210', template: 'welcome', params: ['Priya', 'AurNya'], text: 'Hi Priya' };
  const fakeFetch = (status: number, json: unknown, capture?: { url?: string; init?: RequestInit }) => (async (url: string, init: RequestInit) => { if (capture) { capture.url = url; capture.init = init; } return new Response(JSON.stringify(json), { status }); }) as unknown as typeof fetch;

  test('meta template request is built correctly', async () => {
    const cap: { url?: string; init?: RequestInit } = {};
    const r = await sendWhatsapp(cfg, msg, fakeFetch(200, { messages: [{ id: 'wamid.1' }] }, cap));
    assert.deepEqual(r, { ok: true, id: 'wamid.1' });
    assert.match(cap.url!, /graph\.facebook\.com\/v[\d.]+\/999\/messages/);
    const b = JSON.parse(String(cap.init!.body));
    assert.equal(b.to, '919876543210'); assert.equal(b.type, 'template'); assert.equal(b.template.name, 'aurnya_welcome');
    assert.deepEqual(b.template.components[0].parameters, [{ type: 'text', text: 'Priya' }, { type: 'text', text: 'AurNya' }]);
    assert.equal((cap.init!.headers as Record<string, string>).Authorization, 'Bearer tok');
  });
  test('text mode sends plain text', async () => {
    const cap: { url?: string; init?: RequestInit } = {};
    await sendWhatsapp({ ...cfg, mode: 'text' }, msg, fakeFetch(200, { messages: [{ id: 'x' }] }, cap));
    assert.equal(JSON.parse(String(cap.init!.body)).type, 'text');
  });
  test('rate limit and server errors are retried, a bad number or template is not', async () => {
    const rate = await sendWhatsapp(cfg, msg, fakeFetch(429, { error: { message: 'slow down', code: 130429 } })); assert.ok(!rate.ok && rate.retryable);
    const down = await sendWhatsapp(cfg, msg, fakeFetch(503, {})); assert.ok(!down.ok && down.retryable);
    const bad = await sendWhatsapp(cfg, msg, fakeFetch(400, { error: { message: 'Template name does not exist', code: 132001 } })); assert.ok(!bad.ok && !bad.retryable && /132001/.test(bad.error));
    const net = await sendWhatsapp(cfg, msg, (async () => { throw new Error('boom'); }) as unknown as typeof fetch); assert.ok(!net.ok && net.retryable);
  });
  test('twilio request', async () => {
    const t = readWhatsappConfig({ TWILIO_ACCOUNT_SID: 'ACx', TWILIO_AUTH_TOKEN: 'secret', TWILIO_WHATSAPP_FROM: 'whatsapp:+14155238886' }); assert.ok(t.ok);
    const cap: { url?: string; init?: RequestInit } = {};
    const r = await sendWhatsapp(t.config, msg, fakeFetch(201, { sid: 'SM1' }, cap)); assert.deepEqual(r, { ok: true, id: 'SM1' });
    const body = new URLSearchParams(String(cap.init!.body)); assert.equal(body.get('To'), 'whatsapp:+919876543210'); assert.equal(body.get('From'), 'whatsapp:+14155238886'); assert.equal(body.get('Body'), 'Hi Priya');
  });
});

for (const kind of backends()) {
  describe(`approvals and WhatsApp data (${kind} and memory)`, () => {
    for (const mode of ['db', 'memory'] as const) {
      test(`change requests: one pending copy, decided once, failed ones can be retried [${mode}]`, async () => {
        const h = mode === 'db' ? await openTestDb(kind) : null; const db = h ? h.db : null;
        try {
          const c = { actorEmail: 'admin@aurnya.com', actorRole: 'admin', method: 'PUT', path: '/api/admin/products/1', body: { name: 'A' }, section: 'Products', summary: 'Edit product #1' };
          const a = await createChange(db, c); const dup = await createChange(db, c);
          assert.equal(a.duplicate, false); assert.equal(dup.duplicate, true); assert.equal(dup.request.id, a.request.id);
          assert.equal((await listChanges(db, { role: 'owner', email: 'o' })).pending >= 1, true);
          assert.equal((await listChanges(db, { role: 'manager', email: 'someone-else' })).items.filter((i) => i.id === a.request.id).length, 0, 'staff see only their own requests');
          assert.ok(await claimChange(db, a.request.id, 'approved', 'owner@aurnya.com', null));
          assert.equal(await claimChange(db, a.request.id, 'approved', 'owner@aurnya.com', null), null, 'a request can be decided only once');
          await finishChange(db, a.request.id, false, 'The product was not found.');
          assert.ok(await reopenFailed(db, a.request.id));
          assert.equal(await reopenFailed(db, a.request.id), null);
        } finally { await h?.close(); }
      });
    }
    test(`WhatsApp: opt in on first sign-in only once, STOP is respected, queue never double-sends [${kind}]`, async () => {
      const h = await openTestDb(kind);
      try {
        const [u] = await h.db.insert(users).values({ email: 'p@x.com', passwordHash: 'x', firstName: 'Priya', lastName: 'S', phone: '98765 43210' }).returning();
        const [noPhone] = await h.db.insert(users).values({ email: 'n@x.com', passwordHash: 'x', firstName: 'No', lastName: 'Phone' }).returning();
        const lite = (r: typeof u) => ({ id: r!.id, firstName: r!.firstName, lastName: r!.lastName, phone: r!.phone, whatsappOptInAt: r!.whatsappOptInAt, whatsappOptedOutAt: r!.whatsappOptedOutAt });
        assert.deepEqual(await optInOnLogin(h.db, lite(u), '91'), { subscribed: true, newlySubscribed: true });
        assert.deepEqual((await optInOnLogin(h.db, { ...lite(u), whatsappOptInAt: new Date() }, '91')).newlySubscribed, false);
        assert.equal((await optInOnLogin(h.db, lite(noPhone), '91')).subscribed, false, 'no phone, no subscription');
        assert.equal((await listSubscribers(h.db, '91')).length, 1);
        assert.ok((await setSubscriptionByPhone(h.db, '919876543210', false)) >= 1);   // may also match the built-in demo customer, which shares this number
        assert.equal((await listSubscribers(h.db, '91')).length, 0, 'STOP unsubscribes');
        const after = (await h.db.select().from(users)).find((r) => r.id === u!.id)!;
        assert.equal((await optInOnLogin(h.db, lite(after), '91')).subscribed, false, 'signing in again must NOT re-subscribe someone who said STOP');
        assert.ok(await setSubscription(h.db, u!.id, true, true)); assert.equal((await listSubscribers(h.db, '91')).length, 1);
        assert.equal(await setSubscription(h.db, u!.id, true, false), false, 'cannot subscribe without a usable phone');

        const m = composeOffer('AurNya', 'Priya', '15% off', 'Use FIRST15', 'https://x');
        assert.equal(await enqueue(h.db, [{ userId: u!.id, phone: '919876543210', message: m, dedupeKey: 'offer:1:u' }]), 1);
        assert.equal(await enqueue(h.db, [{ userId: u!.id, phone: '919876543210', message: m, dedupeKey: 'offer:1:u' }]), 0, 'same offer, same person: once');
        const [row] = await claimBatch(h.db, 10); assert.ok(row);
        assert.deepEqual(await claimBatch(h.db, 10), [], 'a claimed message cannot be claimed twice');
        await recordOutcome(h.db, row!, { ok: false, error: 'busy', retry: true });
        const [again] = await claimBatch(h.db, 10); assert.equal(again!.attempts, 2, 'a retryable failure goes back in the queue');
        await recordOutcome(h.db, again!, { ok: true, providerId: 'wamid' });
        assert.deepEqual(await claimBatch(h.db, 10), []);
      } finally { await h.close(); }
    });
  });
}

for (const kind of backends()) {
  test(`dashboard customers list works on a real database [${kind}]`, async () => {
    const h = await openTestDb(kind);
    try {
      await h.db.insert(users).values({ email: 'c@x.com', passwordHash: 'x', firstName: 'Cee', lastName: 'Ex', phone: '98765 43210', whatsappOptInAt: new Date() });
      const r = await listCustomers(h.db);
      assert.equal(r.total, 1); assert.equal(r.rows[0]!.orders, 0); assert.equal(r.rows[0]!.whatsapp, true); assert.equal(r.rows[0]!.city, '—');
    } finally { await h.close(); }
  });
}

describe('WhatsApp memory fallback (demo mode, no database)', () => {
  test('subscribe, queue, dedupe', async () => {
    memoryExtra.outbox.length = 0;
    const u = memoryStore.users[0]!; u.phone = '98765 43210'; u.whatsappOptInAt = null; u.whatsappOptedOutAt = null;
    const r = await optInOnLogin(null, { id: u.id, firstName: u.firstName, lastName: u.lastName, phone: u.phone, whatsappOptInAt: null, whatsappOptedOutAt: null }, '91');
    assert.equal(r.newlySubscribed, true); assert.ok(isSubscribed(u));
    const m = composeWelcome('AurNya', u.firstName, 'https://x');
    assert.equal(await enqueue(null, [{ userId: u.id, phone: '919876543210', message: m, dedupeKey: `welcome:${u.id}` }]), 1);
    assert.equal(await enqueue(null, [{ userId: u.id, phone: '919876543210', message: m, dedupeKey: `welcome:${u.id}` }]), 0);
    u.whatsappOptInAt = null; u.phone = null;
  });
});
