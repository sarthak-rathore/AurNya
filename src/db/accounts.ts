import { eq, and } from 'drizzle-orm';
import { users, userAddresses, userWishlist } from './schema';
import { getDb } from './client';
import { memoryStore } from './memory-store';

export type UserRow = typeof users.$inferSelect;
export type AddressRow = typeof userAddresses.$inferSelect;

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const normEmail = email.toLowerCase().trim();
  const db = getDb();
  if (db) {
    const rows = await db.select().from(users).where(eq(users.email, normEmail)).limit(1);
    if (rows[0]) return rows[0];
  }
  // Check memory store (allows demo login without a running postgres db)
  const mem = memoryStore.users.find(u => u.email.toLowerCase() === normEmail);
  return (mem as unknown as UserRow) ?? null;
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const db = getDb();
  if (db) {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (rows[0]) return rows[0];
  }
  const mem = memoryStore.users.find(u => u.id === id);
  return (mem as unknown as UserRow) ?? null;
}

export async function createUser(data: { email: string; passwordHash: string; firstName: string; lastName: string; phone?: string }): Promise<UserRow> {
  const normEmail = data.email.toLowerCase().trim();
  const db = getDb();
  if (db) {
    const rows = await db.insert(users).values({ email: normEmail, passwordHash: data.passwordHash, firstName: data.firstName, lastName: data.lastName, phone: data.phone }).returning();
    return rows[0]!;
  }
  const newUser = {
    id: crypto.randomUUID(),
    email: normEmail,
    passwordHash: data.passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone ?? null,
    isVerified: true,
    isDemo: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryStore.users.push(newUser);
  return newUser as unknown as UserRow;
}

export async function updateUser(id: string, data: Partial<{ firstName: string; lastName: string; phone: string }>) {
  const db = getDb();
  if (db) {
    await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
    return;
  }
  const user = memoryStore.users.find(u => u.id === id);
  if (user) {
    if (data.firstName !== undefined) user.firstName = data.firstName;
    if (data.lastName !== undefined) user.lastName = data.lastName;
    if (data.phone !== undefined) user.phone = data.phone;
    user.updatedAt = new Date();
  }
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
  const db = getDb();
  if (db) {
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
    return true;
  }
  const user = memoryStore.users.find(u => u.id === id);
  if (user) {
    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
    return true;
  }
  return false;
}

export async function getAddresses(userId: string): Promise<AddressRow[]> {
  const db = getDb();
  if (db) {
    return db.select().from(userAddresses).where(eq(userAddresses.userId, userId));
  }
  return memoryStore.addresses.filter(a => a.userId === userId) as unknown as AddressRow[];
}

export async function addAddress(userId: string, data: Omit<typeof userAddresses.$inferInsert, 'id' | 'userId'>): Promise<AddressRow> {
  const db = getDb();
  if (db) {
    if (data.isDefault) {
      await db.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, userId));
    }
    const rows = await db.insert(userAddresses).values({ ...data, userId }).returning();
    return rows[0]!;
  }
  if (data.isDefault) {
    for (const a of memoryStore.addresses) {
      if (a.userId === userId) a.isDefault = false;
    }
  }
  const newAddr = {
    id: memoryStore.nextAddrId++,
    userId,
    label: data.label ?? 'Home',
    recipientName: data.recipientName,
    line1: data.line1,
    line2: data.line2 ?? null,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    country: data.country ?? 'India',
    phone: data.phone ?? null,
    isDefault: data.isDefault ?? false,
  };
  memoryStore.addresses.push(newAddr);
  return newAddr as unknown as AddressRow;
}

export async function updateAddress(id: number, userId: string, data: Partial<typeof userAddresses.$inferInsert>) {
  const db = getDb();
  if (db) {
    if (data.isDefault) {
      await db.update(userAddresses).set({ isDefault: false }).where(eq(userAddresses.userId, userId));
    }
    await db.update(userAddresses).set(data).where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
    return;
  }
  const addr = memoryStore.addresses.find(a => a.id === id && a.userId === userId);
  if (addr) {
    if (data.isDefault) {
      for (const a of memoryStore.addresses) {
        if (a.userId === userId) a.isDefault = false;
      }
    }
    Object.assign(addr, data);
  }
}

export async function deleteAddress(id: number, userId: string) {
  const db = getDb();
  if (db) {
    await db.delete(userAddresses).where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
    return;
  }
  const index = memoryStore.addresses.findIndex(a => a.id === id && a.userId === userId);
  if (index !== -1) {
    memoryStore.addresses.splice(index, 1);
  }
}

export async function getWishlistIds(userId: string): Promise<number[]> {
  const db = getDb();
  if (db) {
    const rows = await db.select({ productId: userWishlist.productId }).from(userWishlist).where(eq(userWishlist.userId, userId));
    return rows.map((r) => r.productId);
  }
  return memoryStore.wishlist.filter(w => w.userId === userId).map(w => w.productId);
}

export async function syncWishlist(userId: string, productIds: number[]): Promise<void> {
  const db = getDb();
  if (db) {
    if (productIds.length > 0) {
      const values = productIds.map((productId) => ({ userId, productId }));
      await db.insert(userWishlist).values(values).onConflictDoNothing();
    }
    return;
  }
  for (const pid of productIds) {
    if (!memoryStore.wishlist.some(w => w.userId === userId && w.productId === pid)) {
      memoryStore.wishlist.push({ userId, productId: pid, addedAt: new Date() });
    }
  }
}

export async function toggleWishlistItem(userId: string, productId: number): Promise<boolean> {
  const db = getDb();
  if (db) {
    const existing = await db.select().from(userWishlist).where(and(eq(userWishlist.userId, userId), eq(userWishlist.productId, productId))).limit(1);
    if (existing.length > 0) {
      await db.delete(userWishlist).where(and(eq(userWishlist.userId, userId), eq(userWishlist.productId, productId)));
      return false;
    } else {
      await db.insert(userWishlist).values({ userId, productId });
      return true;
    }
  }
  const idx = memoryStore.wishlist.findIndex(w => w.userId === userId && w.productId === productId);
  if (idx !== -1) {
    memoryStore.wishlist.splice(idx, 1);
    return false;
  } else {
    memoryStore.wishlist.push({ userId, productId, addedAt: new Date() });
    return true;
  }
}
