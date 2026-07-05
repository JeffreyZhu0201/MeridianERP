import { CapabilitiesSection } from '@/components/capabilities-section';
import { CtaSection } from '@/components/cta-section';
import { HeroSection } from '@/components/hero-section';
import { MarqueeStrip } from '@/components/marquee-strip';
import { PortalGrid } from '@/components/portal-grid';
import { SiteFooter } from '@/components/site-footer';
import { SiteNav } from '@/components/site-nav';
import { StackSection } from '@/components/stack-section';
import { portals } from '@/lib/portals';

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <main>
        <HeroSection />
        <MarqueeStrip />
        <PortalGrid portals={portals} />
        <CapabilitiesSection />
        <StackSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
