import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  ROLE_COOKIE,
  checkRoleCredentials,
  isSameSiteRequest,
  readRoleConfig,
  safeEqual,
  signRoleToken,
  verifyRoleToken,
  type RoleConfig,
} from './role-auth-core';

const ownerEnv = {
  OWNER_EMAIL: 'owner@aurnya.com',
  OWNER_PASSWORD: 'AurNya@Owner2026',
  ROLE_SESSION_SECRET: 'x'.repeat(32),
  NODE_ENV: 'production',
};

const adminEnv = {
  ADMIN_EMAIL: 'admin@aurnya.com',
  ADMIN_PASSWORD: 'AurNya@Admin2026',
  ROLE_SESSION_SECRET: 'x'.repeat(32),
  NODE_ENV: 'production',
};

const managerEnv = {
  MANAGER_EMAIL: 'manager@aurnya.com',
  MANAGER_PASSWORD: 'AurNya@Manager2026',
  ROLE_SESSION_SECRET: 'x'.repeat(32),
  NODE_ENV: 'production',
};

describe('role-based authentication', () => {
  test('correctly loads config for all 3 roles', () => {
    const owner = readRoleConfig('owner', ownerEnv);
    assert.equal(owner.ok, true);
    if (owner.ok) {
      assert.equal(owner.config.email, 'owner@aurnya.com');
      assert.equal(owner.config.role, 'owner');
    }

    const admin = readRoleConfig('admin', adminEnv);
    assert.equal(admin.ok, true);
    if (admin.ok) {
      assert.equal(admin.config.email, 'admin@aurnya.com');
      assert.equal(admin.config.role, 'admin');
    }

    const manager = readRoleConfig('manager', managerEnv);
    assert.equal(manager.ok, true);
    if (manager.ok) {
      assert.equal(manager.config.email, 'manager@aurnya.com');
      assert.equal(manager.config.role, 'manager');
    }
  });

  test('validates passwords and rejects short or missing credentials', () => {
    assert.equal(readRoleConfig('owner', {}).ok, false);
    assert.equal(readRoleConfig('owner', { ...ownerEnv, OWNER_PASSWORD: 'short' }).ok, false);
    assert.equal(readRoleConfig('owner', { ...ownerEnv, OWNER_EMAIL: 'invalid-email' }).ok, false);
  });

  test('sign and verify token for each role', () => {
    const oRes = readRoleConfig('owner', ownerEnv);
    assert.ok(oRes.ok);
    const cfg = oRes.config;
    const token = signRoleToken(cfg, 1_000_000);
    const verified = verifyRoleToken(cfg, token, 1_000_000 + 1000);

    assert.deepEqual(verified, { email: 'owner@aurnya.com', role: 'owner' });

    // Expired after 12 hours
    assert.equal(verifyRoleToken(cfg, token, 1_000_000 + 13 * 3600_000), null);

    // Cross-role verification must fail (an admin config cannot verify an owner token)
    const aRes = readRoleConfig('admin', adminEnv);
    assert.ok(aRes.ok);
    assert.equal(verifyRoleToken(aRes.config, token, 1_000_000 + 1000), null);
  });

  test('cookie names for roles are isolated', () => {
    assert.equal(ROLE_COOKIE.owner, 'aur_owner');
    assert.equal(ROLE_COOKIE.admin, 'aur_admin');
    assert.equal(ROLE_COOKIE.manager, 'aur_manager');
  });

  test('same site protection check works for role requests', () => {
    const h = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });
    assert.ok(isSameSiteRequest(h({ host: 'shop.in', origin: 'https://shop.in' })));
    assert.ok(!isSameSiteRequest(h({ host: 'shop.in', origin: 'https://evil.com' })));
  });
});
