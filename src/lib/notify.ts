/** Tiny browser-side message bus: any dashboard screen can show a toast (the shell listens and draws it). */
export type NoticeTone = 'ok' | 'pending' | 'error';
export const NOTICE_EVENT = 'aurnya:notice';
export function notify(message: string, tone: NoticeTone = 'ok'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NOTICE_EVENT, { detail: { message, tone } }));
}
