import type { PortalLink } from '@/lib/portals';

/** URL embedded in landing previews — real portal UI, not mock chrome. */
export function portalEmbedUrl(portal: PortalLink): string {
  if (portal.id === 'store') {
    return portal.href;
  }
  const base = portal.href.replace(/\/$/, '');
  return `${base}/embed-preview`;
}
