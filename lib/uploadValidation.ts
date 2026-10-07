/** Validate image uploads: MIME allowlist + size cap. */
export function validateImageUpload(
  file: File,
  opts: { maxBytes?: number; allowedTypes?: string[] } = {}
): { ok: true } | { ok: false; error: string } {
  const maxBytes = opts.maxBytes ?? 2 * 1024 * 1024;
  const allowedTypes = opts.allowedTypes ?? [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/x-icon',
    'image/vnd.microsoft.icon',
  ];

  if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
    return { ok: false, error: 'Tipe file tidak diizinkan. Gunakan PNG, JPEG, atau WebP.' };
  }
  if (typeof file.size === 'number' && file.size > maxBytes) {
    return { ok: false, error: `Ukuran file melebihi batas ${(maxBytes / (1024 * 1024)).toFixed(0)}MB.` };
  }
  return { ok: true };
}

export function safeImageExtension(filename: string, mimeType: string): string {
  const fromName = (filename.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const mimeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
  };
  const fromMime = mimeMap[mimeType.toLowerCase()];
  if (fromName && ['png', 'jpg', 'jpeg', 'webp', 'ico'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  return fromMime || 'png';
}
