import { ScrollDirector } from "@/components/motion/ScrollDirector";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SceneRoot } from "@/components/scene/SceneRoot";
import { Contact } from "@/components/sections/Contact";
import { EarthPanel } from "@/components/sections/EarthPanel";
import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { SiteFooter } from "@/components/sections/SiteFooter";

export default function Home() {
  return (
    <>
      <SceneRoot />
      <SmoothScroll />
      <ScrollDirector />
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
