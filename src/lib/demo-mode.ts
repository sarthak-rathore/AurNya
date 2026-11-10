/**
 * Master Demo Mode Controller for AurNya.
 *
 * When Demo Mode is ACTIVE:
 *  - Demo account auto-fill banner is displayed
 *  - Fixed OTP "000000" can be used for quick testing
 *  - Fallback in-memory catalog / mock data is used if no DB is connected
 *  - "(demo data)" and preview badges are visible
 *
 * When Demo Mode is INACTIVE (Production Real Mode):
 *  - ALL dummy data, banners, autofills, and demo hints VANISH completely
 *  - Real PostgreSQL database is queried exclusively
 *  - Real 6-digit cryptographic OTPs are sent via email (Resend)
 *  - Only real store statistics, orders, and real live inventory are shown
 */

export function isDemoMode(): boolean {
  // Explicit override in environment:
  if (process.env.DEMO_MODE === 'false' || process.env.NEXT_PUBLIC_DEMO_MODE === 'false') {
    return false;
  }
  if (process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return true;
  }
  // Default: if no database connection string exists, fallback to demo mode
  return !process.env.DATABASE_URL;
}
