import { MediaStage } from "@/components/media/MediaStage";
import { ScrollDirector } from "@/components/motion/ScrollDirector";
import { ScrollRuler } from "@/components/motion/ScrollRuler";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Contact } from "@/components/sections/Contact";
import { EarthPanel } from "@/components/sections/EarthPanel";
import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { SiteFooter } from "@/components/sections/SiteFooter";

export default function Home() {
  return (
    <>
      <MediaStage />
      <SmoothScroll />
      <ScrollDirector />
      <ScrollRuler />
      <main className="relative z-10">
        <Hero />
        <Services />
        {/* Frota, Antes e depois e Onde atuamos entram no painel quando chegar o material da cliente. */}
        <EarthPanel>
          <Process />
        </EarthPanel>
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
