import type { PortalLink } from '@/lib/portals';

/** URL embedded in landing previews — real portal UI, not mock chrome. */
export function portalEmbedUrl(portal: PortalLink): string {
  const base = portal.href.replace(/\/$/, '').replace(/\/shop$/, '');
  return `${base}/embed-preview`;
}
