import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discountPercent, formatINR } from './money';
test('formats paise as rupees', () => assert.match(formatINR(79900), /799/));
test('discount percent', () => { assert.equal(discountPercent(119900, 149900), 20); assert.equal(discountPercent(100, undefined), 0); assert.equal(discountPercent(200, 100), 0); });
