import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ADMIN_COOKIE, checkCredentials, isSameSiteRequest, readAdminConfig, safeEqual, signAdminToken, verifyAdminToken, type AdminConfig } from './admin-auth-core';
import { istInputToIso, isoToIstInput, paiseToRupees, rupeesToPaise, slugify, whatsappDigits } from './admin-format';
import { announcementSchema, couponInputSchema, heroImagesSchema, orderActionSchema, productInputSchema, stockAdjustSchema } from './admin-schemas';
import { cloudinaryConfig, signParams, uploadSignature } from './cloudinary';
import { toCsv } from './csv';
import { isAllowedImageUrl, isAllowedVideoUrl, isSafeLink } from './image-url';
import { allowedNext, canTransition, ORDER_STATUSES } from './order-status';
import { DEMO_HERO_IMAGES, parseHeroImages } from './hero-images';

const env = { ADMIN_EMAIL: 'Owner@AurNya.in', ADMIN_PASSWORD: 'correct horse battery', JWT_SECRET: 'x'.repeat(32), NODE_ENV: 'production' };
const cfg = (e: Record<string, string | undefined> = env): AdminConfig => { const r = readAdminConfig(e); assert.ok(r.ok); return r.config; };

describe('admin sign-in', () => {
  test('needs email, a long enough password and (in production) a real secret', () => {
    assert.equal(readAdminConfig({}).ok, false);
    assert.equal(readAdminConfig({ ...env, ADMIN_PASSWORD: 'short' }).ok, false);
    assert.equal(readAdminConfig({ ...env, ADMIN_EMAIL: 'nope' }).ok, false);
    assert.equal(readAdminConfig({ ...env, JWT_SECRET: undefined }).ok, false, 'production without a secret is refused');
    assert.equal(readAdminConfig({ ...env, NODE_ENV: 'development', JWT_SECRET: undefined }).ok, true);
    assert.equal(cfg().email, 'owner@aurnya.in');
  });
  test('credentials: both must match; email is case-insensitive; password is exact', () => {
    const c = cfg();
    assert.ok(checkCredentials(c, ' OWNER@aurnya.in ', 'correct horse battery'));
    assert.ok(!checkCredentials(c, 'owner@aurnya.in', 'Correct horse battery'));
    assert.ok(!checkCredentials(c, 'other@aurnya.in', 'correct horse battery'));
    assert.ok(!checkCredentials(c, '', ''));
    assert.ok(safeEqual('a', 'a') && !safeEqual('a', 'b') && !safeEqual('a', 'aa'));
  });
  test('a session token works, expires, and cannot be forged or reused after a password change', () => {
    const c = cfg(); const t = signAdminToken(c, 1_000_000);
    assert.deepEqual(verifyAdminToken(c, t, 1_000_000 + 1000), { email: 'owner@aurnya.in' });
    assert.equal(verifyAdminToken(c, t, 1_000_000 + 13 * 3600_000), null, 'expired after 12 hours');
    assert.equal(verifyAdminToken(c, undefined), null); assert.equal(verifyAdminToken(c, 'garbage'), null); assert.equal(verifyAdminToken(c, 'a.b.c'), null);
    const [body, sig] = t.split('.'); const forged = Buffer.from(JSON.stringify({ aud: 'aurnya-admin', email: c.email, pv: 'x', iat: 1, exp: 99999999999 })).toString('base64url');
    assert.equal(verifyAdminToken(c, `${forged}.${sig}`, 1_000_000), null); assert.equal(verifyAdminToken(c, `${body}.${sig.slice(0, -2)}AA`, 1_000_000), null);
    assert.equal(verifyAdminToken(cfg({ ...env, ADMIN_PASSWORD: 'a different long password' }), t, 1_000_001), null, 'changing the password signs everyone out');
    assert.equal(verifyAdminToken(cfg({ ...env, JWT_SECRET: 'y'.repeat(32) }), t, 1_000_001), null, 'a different secret does not accept it');
    assert.equal(ADMIN_COOKIE, 'aur_admin');
  });
  test('a customer login token is not an admin token', () => {
    const c = cfg(); const body = Buffer.from(JSON.stringify({ sub: 'user-1', email: c.email, exp: 9e12 })).toString('base64url');
    assert.equal(verifyAdminToken(c, `${body}.${body}`), null);
  });
  test('changes must come from this site', () => {
    const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });
    assert.ok(isSameSiteRequest(h({ host: 'shop.in', origin: 'https://shop.in' })));
    assert.ok(!isSameSiteRequest(h({ host: 'shop.in', origin: 'https://evil.com' })));
    assert.ok(!isSameSiteRequest(h({ host: 'shop.in', origin: 'not a url' })));
    assert.ok(isSameSiteRequest(h({ host: 'internal', 'x-forwarded-host': 'shop.in', origin: 'https://shop.in' })));
    assert.ok(!isSameSiteRequest(h({ host: 'shop.in', 'sec-fetch-site': 'cross-site' })));
    assert.ok(isSameSiteRequest(h({ host: 'shop.in', 'sec-fetch-site': 'same-origin' })));
    assert.ok(isSameSiteRequest(h({ host: 'shop.in' })));
  });
});

describe('formatting helpers', () => {
  test('slugify', () => { assert.equal(slugify('Blossom Drop Earrings!'), 'blossom-drop-earrings'); assert.equal(slugify('  Café --  Ring  '), 'cafe-ring'); assert.equal(slugify('###'), ''); assert.ok(slugify('a'.repeat(200)).length <= 80); });
  test('rupees <-> paise without float errors', () => {
    assert.equal(rupeesToPaise('799'), 79900); assert.equal(rupeesToPaise('799.5'), 79950); assert.equal(rupeesToPaise('₹1,299.05'), 129905); assert.equal(rupeesToPaise(19.99), 1999);
    for (const bad of ['', 'abc', '-5', '1.234', '1e3', '1,2,3x', null, undefined, '99999999']) assert.equal(rupeesToPaise(bad as never), null, String(bad));
    assert.equal(paiseToRupees(79900), '799'); assert.equal(paiseToRupees(79905), '799.05'); assert.equal(paiseToRupees(null), '');
    assert.equal(rupeesToPaise('0.29'), 29); assert.equal(rupeesToPaise('1.10'), 110);
  });
  test('India time conversion round-trips', () => {
    assert.equal(istInputToIso('2026-11-02T10:30'), '2026-11-02T05:00:00.000Z'); assert.equal(isoToIstInput('2026-11-02T05:00:00.000Z'), '2026-11-02T10:30');
    assert.equal(istInputToIso('2026-11-02T00:10'), '2026-11-01T18:40:00.000Z'); assert.equal(istInputToIso('bad'), null); assert.equal(istInputToIso(''), null); assert.equal(isoToIstInput(null), '');
  });
  test('whatsapp digits', () => { assert.equal(whatsappDigits('98765 43210'), '919876543210'); assert.equal(whatsappDigits('+91 98765-43210'), '919876543210'); assert.equal(whatsappDigits(null), ''); });
});

describe('picture and link safety', () => {
  test('only local files and Cloudinary pictures are accepted', () => {
    for (const ok of ['/images/ring.png', '/images/a b.png'.replace(' ', '-'), 'https://res.cloudinary.com/demo/image/upload/v1/aurnya/x.jpg']) assert.ok(isAllowedImageUrl(ok), ok);
    for (const bad of ['', 'http://res.cloudinary.com/a.jpg', 'https://evil.com/a.jpg', 'https://res.cloudinary.com.evil.com/a.jpg', 'https://user:pw@res.cloudinary.com/a.jpg', '//evil.com/a.png', '/../etc/passwd.png', '/images/ring.svg', '/images/ring', 'javascript:alert(1)', 'data:image/png;base64,AAAA', 'https://res.cloudinary.com/a b.jpg', null, 5])
      assert.ok(!isAllowedImageUrl(bad as never), String(bad));
  });
  test('videos and links', () => {
    assert.ok(isAllowedVideoUrl('/videos/a.mp4') && isAllowedVideoUrl('https://cdn.example.com/a.mp4')); assert.ok(!isAllowedVideoUrl('http://x.com/a.mp4') && !isAllowedVideoUrl('/videos/a.exe'));
    assert.ok(isSafeLink('/shop') && isSafeLink('https://example.com/x')); assert.ok(!isSafeLink('javascript:alert(1)') && !isSafeLink('//evil.com') && !isSafeLink('http://x.com') && !isSafeLink('data:text/html,x'));
  });
  test('the home page ignores an unsafe stored picture and keeps the default', () => {
    const p = parseHeroImages({ ...DEMO_HERO_IMAGES, slide_rings_art: 'https://evil.com/x.png', slide_gifts_art: '', col_gifts: 'https://res.cloudinary.com/demo/image/upload/g.jpg' });
    assert.equal(p.slide_rings_art, DEMO_HERO_IMAGES.slide_rings_art); assert.equal(p.slide_gifts_art, ''); assert.equal(p.col_gifts, 'https://res.cloudinary.com/demo/image/upload/g.jpg');
    assert.deepEqual(parseHeroImages(null), DEMO_HERO_IMAGES);
  });
});

describe('order status rules', () => {
  test('final states have no exits; the normal path exists', () => {
    for (const m of ['cod', 'razorpay'] as const) { assert.deepEqual(allowedNext('cancelled', m), []); assert.deepEqual(allowedNext('refunded', m), []); }
    assert.ok(canTransition('paid', 'packed', 'razorpay') && canTransition('packed', 'shipped', 'cod') && canTransition('shipped', 'delivered', 'cod'));
  });
  test('you cannot skip steps, go backwards, or pack an unpaid online order', () => {
    assert.ok(!canTransition('paid', 'shipped', 'razorpay') && !canTransition('paid', 'delivered', 'razorpay') && !canTransition('delivered', 'shipped', 'cod') && !canTransition('shipped', 'cancelled', 'cod'));
    assert.ok(!canTransition('pending_payment', 'packed', 'razorpay')); assert.ok(canTransition('pending_payment', 'packed', 'cod'));
    for (const s of ORDER_STATUSES) assert.ok(!canTransition(s, s, 'cod'), 'no self-moves');
  });
});

describe('form validation', () => {
  const base = { name: 'Moon Ring', sku: 'MOON-1', category: 'Rings', price: '899', status: 'active' };
  test('a valid product parses with sensible defaults', () => {
    const p = productInputSchema.parse(base); assert.equal(p.price, 89900); assert.equal(p.comparePrice, null); assert.deepEqual(p.images, []); assert.equal(p.variants, null); assert.equal(p.slug, '');
  });
  test('bad products are refused with a readable reason', () => {
    const msg = (o: Record<string, unknown>) => { const r = productInputSchema.safeParse({ ...base, ...o }); assert.equal(r.success, false, JSON.stringify(o)); return r.error!.issues[0].message; };
    assert.match(msg({ name: '' }), /name/i); assert.match(msg({ price: 'free' }), /rupees/); assert.match(msg({ price: '100', comparePrice: '100' }), /higher/);
    assert.match(msg({ sku: 'bad sku!' }), /SKU/); assert.match(msg({ category: 'Hats' }), /category/i);
    assert.match(msg({ images: [{ src: 'https://evil.com/x.jpg', alt: '' }] }), /Cloudinary/); assert.match(msg({ images: [{ src: '/images/a.png', alt: '' }, { src: '/images/a.png', alt: '' }] }), /twice/);
    assert.match(msg({ variants: { label: 'Size', options: [{ value: '6', stock: 1 }, { value: '6', stock: 2 }] } }), /twice/); assert.match(msg({ variants: { label: 'Size', options: [] } }), /at least one/i);
    assert.match(msg({ video: 'javascript:alert(1)' }), /video/i); assert.match(msg({ stock: -1 }), /less than/); assert.match(msg({ stock: 1.5 }), /whole/); assert.match(msg({ tags: ['hot'] }) || 'x', /./);
  });
  test('stock changes', () => {
    assert.ok(stockAdjustSchema.safeParse({ productId: 1, mode: 'add', value: -3 }).success); assert.ok(!stockAdjustSchema.safeParse({ productId: 1, mode: 'set', value: -3 }).success); assert.ok(!stockAdjustSchema.safeParse({ productId: 0, mode: 'set', value: 3 }).success);
  });
  test('announcement', () => {
    assert.ok(announcementSchema.safeParse({ visible: true, message: 'Free shipping', href: '/shop', linkText: 'Shop' }).success);
    assert.ok(!announcementSchema.safeParse({ visible: true, message: '', href: '', linkText: '' }).success);
    assert.ok(!announcementSchema.safeParse({ visible: true, message: 'x', href: 'javascript:alert(1)', linkText: 'x' }).success);
    assert.ok(!announcementSchema.safeParse({ visible: true, message: 'x', href: '/a', linkText: '' }).success);
    assert.ok(!announcementSchema.safeParse({ visible: true, message: 'x', href: '', linkText: '', start: '2026-12-01T00:00', end: '2026-11-01T00:00' }).success);
    assert.ok(announcementSchema.safeParse({ visible: false, message: '', href: '', linkText: '' }).success, 'switched off needs no message');
  });
  test('home pictures and order actions', () => {
    const slots = Object.fromEntries(Object.keys(DEMO_HERO_IMAGES).map((k) => [k, ''])); assert.ok(heroImagesSchema.safeParse(slots).success); assert.ok(!heroImagesSchema.safeParse({ ...slots, col_gifts: 'https://evil.com/a.png' }).success);
    assert.ok(orderActionSchema.safeParse({ action: 'status', to: 'packed' }).success); assert.ok(!orderActionSchema.safeParse({ action: 'status', to: 'teleported' }).success);
    assert.ok(!orderActionSchema.safeParse({ action: 'status', to: 'shipped', trackingUrl: 'javascript:alert(1)' }).success); assert.ok(!orderActionSchema.safeParse({ action: 'tracking', courier: '' }).success);
    assert.ok(orderActionSchema.safeParse({ action: 'note', adminNote: 'hi' }).success); assert.ok(!orderActionSchema.safeParse({ action: 'delete' }).success);
  });
  test('coupon dates are India time', () => { const c = couponInputSchema.parse({ code: 'x1y', kind: 'percent', value: '10', startsAt: '2026-11-02T10:30' }); assert.equal(c.code, 'X1Y'); assert.equal(c.startsAt!.toISOString(), '2026-11-02T05:00:00.000Z'); });
});

describe('cloudinary signing and csv', () => {
  test('signature algorithm matches Cloudinary documentation example', () => {
    assert.equal(signParams({ public_id: 'sample_image', timestamp: 1315060510, eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop' }, 'abcd'), 'bfd09f95f331f558cbd1320e67aa8d488770583e');
  });
  test('upload signature signs format limit, folder and time, never exposes the secret', () => {
    assert.equal(cloudinaryConfig({}), null); const c = cloudinaryConfig({ CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'k', CLOUDINARY_API_SECRET: 's3cret' })!;
    const s = uploadSignature(c, 1_700_000_000_000); assert.equal(s.timestamp, 1_700_000_000); assert.equal(s.signature, signParams({ allowed_formats: 'jpg,jpeg,png,webp,avif', folder: 'aurnya', timestamp: 1_700_000_000 }, 's3cret'));
    assert.ok(!JSON.stringify(s).includes('s3cret'));
  });
  test('csv quoting and formula protection', () => {
    const out = toCsv([['a', 'b,c', 'say "hi"', '=SUM(A1)', '-5', '+91 98765', null, 12]]);
    assert.ok(out.startsWith('\uFEFF')); assert.ok(out.includes('a,"b,c","say ""hi""",\'=SUM(A1),-5,\'+91 98765,,12'));
  });
});
