import { MediaStage } from "@/components/media/MediaStage";
import { DustOnHover } from "@/components/motion/DustOnHover";
import { ScrollDirector } from "@/components/motion/ScrollDirector";
import { ScrollRuler } from "@/components/motion/ScrollRuler";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { BeforeAfter } from "@/components/sections/BeforeAfter";
import { Contact } from "@/components/sections/Contact";
import { EarthPanel } from "@/components/sections/EarthPanel";
import { Hero } from "@/components/sections/Hero";
import { Machines } from "@/components/sections/Machines";
import { Process } from "@/components/sections/Process";
import { Region } from "@/components/sections/Region";
import { Services } from "@/components/sections/Services";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { LocalBusinessJsonLd } from "@/components/seo/LocalBusinessJsonLd";

/** A página inteira. */
export function Landing() {
  return (
    <>
      <MediaStage />
      <SmoothScroll />
      <ScrollDirector />
      <ScrollRuler />
      <DustOnHover />
      <main className="relative z-10">
        <Hero />
        <Services />
        <EarthPanel>
          <Process />
          <Machines />
          <BeforeAfter />
          <Region />
        </EarthPanel>
        <Contact />
      </main>
      <SiteFooter />
      <LocalBusinessJsonLd />
    </>
  );
}
