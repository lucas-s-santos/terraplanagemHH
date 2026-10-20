import { ScrollDirector } from "@/components/motion/ScrollDirector";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SceneRoot } from "@/components/scene/SceneRoot";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";

export default function Home() {
  return (
    <>
      <SceneRoot />
      <SmoothScroll />
      <ScrollDirector />
      <main className="relative z-10">
        <Hero />
        <Services />
      </main>
    </>
  );
}
