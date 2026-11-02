/** Local calendar day as YYYY-MM-DD, the key the meals API uses for "a day". */
export function localDateKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Minutes ahead of UTC on this phone (India: 330). */
export function utcOffsetMinutes(date: Date = new Date()): number {
  return -date.getTimezoneOffset();
}

/** "1:05 pm" in the phone's locale. */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
