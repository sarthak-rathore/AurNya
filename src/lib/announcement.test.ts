import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { isAnnouncementActive, parseAnnouncement, type Announcement } from './announcement';

const base: Announcement = { visible: true, message: 'Hello', href: '/shop', linkText: 'Shop', start: null, end: null };

describe('reading the stored announcement', () => {
  test('anything that is not an object falls back to the default', () => { for (const raw of [null, undefined, 5, 'x', [], true]) assert.deepEqual(parseAnnouncement(raw, base), base); });
  test('a good record is read as written', () => {
    const r = parseAnnouncement({ visible: false, message: ' Sale ', href: 'https://example.com/x', linkText: 'Go', start: '2026-01-01T00:00:00Z', end: '2026-02-01T00:00:00Z' }, base);
    assert.deepEqual(r, { visible: false, message: 'Sale', href: 'https://example.com/x', linkText: 'Go', start: '2026-01-01T00:00:00Z', end: '2026-02-01T00:00:00Z' });
  });
  test('dangerous or off-site links are dropped', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,x', '//evil.com', 'http://insecure.com', 'ftp://x', ' javascript:x']) assert.equal(parseAnnouncement({ message: 'x', href }, base).href, '', href);
    assert.equal(parseAnnouncement({ message: 'x', href: '/shop?tag=new' }, base).href, '/shop?tag=new');
  });
  test('bad dates are ignored, wrong types fall back, long text is cut', () => {
    const r = parseAnnouncement({ visible: 'yes', message: 'x'.repeat(1000), linkText: 5, start: 'nonsense', end: 12 }, base);
    assert.equal(r.visible, true); assert.equal(r.message.length, 300); assert.equal(r.linkText, ''); assert.equal(r.start, null); assert.equal(r.end, null);
  });
});
describe('when the bar shows', () => {
  const t = (s: string) => +new Date(s);
  test('visible flag, message and schedule all have to agree', () => {
    assert.equal(isAnnouncementActive(base), true);
    assert.equal(isAnnouncementActive({ ...base, visible: false }), false);
    assert.equal(isAnnouncementActive({ ...base, message: '' }), false);
    const sched = { ...base, start: '2026-03-01T00:00:00Z', end: '2026-03-10T00:00:00Z' };
    assert.equal(isAnnouncementActive(sched, t('2026-02-28T23:59:59Z')), false);
    assert.equal(isAnnouncementActive(sched, t('2026-03-01T00:00:00Z')), true);
    assert.equal(isAnnouncementActive(sched, t('2026-03-10T00:00:00Z')), true);
    assert.equal(isAnnouncementActive(sched, t('2026-03-10T00:00:01Z')), false);
  });
});
