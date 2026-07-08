const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const SIGNATURES: Array<{ mime: string; bytes: number[] }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

export function isAllowedImageMime(mimeType: string): boolean {
  return ALLOWED_MIME.has(mimeType);
}

export function detectImageMime(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (sig.bytes.every((byte, index) => buffer[index] === byte)) {
      if (sig.mime === 'image/webp') {
        const webp = buffer.subarray(8, 12).toString('ascii');
        if (webp !== 'WEBP') continue;
      }
      return sig.mime;
    }
  }
  return null;
}

export function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}
