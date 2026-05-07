// Tiny client-side singleton for handing a File from the dashboard's quick
// actions to the submit page on the next route. Module state survives Next.js
// client-side navigation (the bundle is shared) but is lost on a full reload —
// which is fine because the submit page only consumes it once on mount.

let pending: File | null = null;

export function setPendingFile(f: File): void {
  pending = f;
}

export function takePendingFile(): File | null {
  const f = pending;
  pending = null;
  return f;
}
